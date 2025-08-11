import { eventBus } from '@core/eventBus';
import { invoiceEventStore } from '@core/eventStore';
import { buildLiveModel } from '../02_ProjectionRaisingInvoicesToDo/liveModel';
import { InvoiceRaisedEvent } from '@events/invoiceRaisedEvent';
import { InvoiceRejectedEvent } from '@events/invoiceRejectedEvent';
import { createInvoiceToDoItemClosedEvent } from '../03_InvoicesProcessing/createInvoiceToDoItemClosedEvent';
import { v4 as uuidv4 } from 'uuid';

let isInvoiceProcessHandlerInitialized = false;

export const initializeInvoiceProcessHandler = () => {
  if (isInvoiceProcessHandlerInitialized) {
    console.warn('[InvoiceProcessHandler] Already initialized. Skipping re-subscription.');
    return;
  }

  // Subscribe to new todo items being added
  eventBus.subscribe('invoiceToRaiseToDoItemAdded', () => {
    console.log('[InvoiceProcessHandler] New todo item added. Processing all incomplete todo items...');
    processIncompleteToDoItems();
  });

  isInvoiceProcessHandlerInitialized = true;
  console.log('[InvoiceProcessHandler] Initialized and subscribed to new todo events.');
};

// Main processor function - processes ALL incomplete todos
export const processIncompleteToDoItems = () => {
  console.log('[InvoiceProcessHandler] Starting to process all incomplete todo items...');

  // Get IDs of incomplete to-do items from the live model
  const incompleteToDoIds = buildLiveModel();
  console.log(`[InvoiceProcessHandler] Found ${incompleteToDoIds.length} incomplete todo items to process`);

  // Process each incomplete to-do item
  incompleteToDoIds.forEach(aggregateId => {
    const todoItem = getTodoItemDetails(aggregateId);
    if (todoItem) {
      console.log(`[InvoiceProcessHandler] Processing todo item: ${aggregateId}`);
      processSingleTodoItem(todoItem);
    } else {
      console.warn(`[InvoiceProcessHandler] Todo item details not found for aggregateId: ${aggregateId}`);
    }
  });

  console.log('[InvoiceProcessHandler] Finished processing all incomplete todo items');
};


// Placeholder function to fetch to-do item details by aggregateId
function getTodoItemDetails(aggregateId) {
  // This function should be implemented to fetch the complete details of a to-do item
  // For now, we'll return a mock object
  return {
    aggregateId,
    jobId: `job_${aggregateId}`,
    customerId: `customer_${aggregateId}`,
    payload: {
      quotationId: `quote_${aggregateId}`,
      quotationDetails: {
        estimatedAmount: 100,
        currency: 'USD'
      },
      jobDetails: {
        title: `Job Title for ${aggregateId}`
      }
    }
  };
}

// Process a single todo item
const processSingleTodoItem = (todo) => {
  console.log(`[InvoiceProcessHandler] Processing todo item: ${todo.aggregateId}`);
  const invoiceId = uuidv4();
  const isDataAvailable = checkDataAvailability(todo.payload || todo);

  // Create the todo close event
  const invoiceToDoItemClosedEvent = createInvoiceToDoItemClosedEvent(todo.aggregateId);

  if (isDataAvailable) {
    console.log(`[InvoiceProcessHandler] Creating invoice for todo: ${todo.aggregateId}`);

    // Extract data from todo item
    const jobId = todo.jobId;
    const quotationId = todo.quotationId || todo.payload?.quotationId;
    const customerId = todo.customerId || todo.payload?.customerId;
    const amount = todo.amount || todo.payload?.quotationDetails?.estimatedAmount;
    const currency = todo.currency || todo.payload?.quotationDetails?.currency;
    const description = todo.description || todo.payload?.jobDetails?.title;

    // Create the invoice event
    const invoiceCreatedEvent = InvoiceRaisedEvent(
      invoiceId,
      jobId,
      quotationId,
      customerId,
      amount,
      currency,
      description
    );

    // Append the closed event and publish the created invoice event
    invoiceEventStore.append(invoiceToDoItemClosedEvent);
    eventBus.publish(invoiceCreatedEvent);

    console.log(`[InvoiceProcessHandler] Successfully processed todo ${todo.aggregateId}, created invoice ${invoiceId}`);
  } else {
    console.log(`[InvoiceProcessHandler] Missing data for todo: ${todo.aggregateId}, marking as complete with missing info flag`);

    // Add missing information flag
    invoiceToDoItemClosedEvent.data = {
      ...invoiceToDoItemClosedEvent.data,
      missingInformation: true,
      processedSuccessfully: false
    };

    // Create the invoice rejected event
    const rejectedInvoiceId = uuidv4();
    const invoiceRejectedEvent = InvoiceRejectedEvent(rejectedInvoiceId, todo.jobId, 'Missing required information for invoice creation');

    // Append the closed event and publish the rejected invoice event
    invoiceEventStore.append(invoiceToDoItemClosedEvent);
    eventBus.publish(invoiceRejectedEvent);

    console.log(`[InvoiceProcessHandler] Marked todo ${todo.aggregateId} as complete: missing information`);
  }
};


function checkDataAvailability(data) {
  // Check if all required fields are present
  const requiredFields = ['jobId'];

  for (const field of requiredFields) {
    const hasDirectField = data[field];
    const hasPayloadField = data.payload?.[field];
    const hasNestedField = data.payload?.quotationDetails?.[field] || data.payload?.jobDetails?.[field];

    if (!hasDirectField && !hasPayloadField && !hasNestedField) {
      console.log(`[InvoiceProcessHandler] Missing required field: ${field}`);
      return true;
    }
  }

  // Check for amount specifically (can be in quotationDetails)
  const hasAmount = data.amount || data.payload?.quotationDetails?.estimatedAmount;
  if (!hasAmount) {
    console.log(`[InvoiceProcessHandler] Missing required field: amount`);
    return true;
  }

  return true;
}

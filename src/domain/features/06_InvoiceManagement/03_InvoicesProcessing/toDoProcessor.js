import { eventBus } from '@core/eventBus';
import { invoiceEventStore } from '@core/eventStore';
import { InvoiceRaisedEvent } from '@events/invoiceRaisedEvent';
import { InvoiceRejectedEvent } from '@events/invoiceRejectedEvent';
import { createInvoiceToDoItemClosedEvent } from '../03_InvoicesProcessing/createInvoiceToDoItemClosedEvent';
import { createInvoiceToDoItemFailedEvent } from '../03_InvoicesProcessing/createInvoiceToDoItemFailedEvent';
import { queryToDosProjection, buildLiveModel } from '../02_ProjectionRaisingInvoicesToDo/liveModel';
import { v4 as uuidv4 } from 'uuid';

let isInvoiceProcessHandlerInitialized = false;

export const initializeInvoiceProcessHandler = () => {
  console.log('[initializeInvoiceProcessHandler] Entering function');
  if (isInvoiceProcessHandlerInitialized) {
    console.warn('[InvoiceProcessHandler] Already initialized. Skipping re-subscription.');
    return;
  }

  eventBus.subscribe('invoiceToRaiseToDoItemAdded', () => {
    console.log('[InvoiceProcessHandler] New todo item added. Processing incomplete todo items...');
    processIncompleteToDoItems();
  });

  isInvoiceProcessHandlerInitialized = true;
  console.log('[InvoiceProcessHandler] Initialized and subscribed to new todo events.');
};

const processIncompleteToDoItems = () => {
  console.log('[processIncompleteToDoItems] Entering function');
  console.log('[InvoiceProcessHandler] Starting to process incomplete todo items...');

  // Build the live model to ensure it's up-to-date
  buildLiveModel();

  // Query the live model for incomplete to-do items
  const toDos = queryToDosProjection();
  console.log('[processIncompleteToDoItems] Retrieved todos:', toDos);

  const incompleteToDoIds = toDos
    .filter(todo => todo.toDoComplete === false)
    .map(todo => todo.aggregateId);

  console.log(`[InvoiceProcessHandler] Found ${incompleteToDoIds.length} incomplete todo items to process`);

  incompleteToDoIds.forEach(aggregateId => {
    console.log(`[processIncompleteToDoItems] Processing aggregateId: ${aggregateId}`);
    const todoItem = getTodoItemDetails(aggregateId);
    if (todoItem && todoItem.toDoComplete === false) {
      console.log(`[InvoiceProcessHandler] Processing todo item: ${aggregateId}`);
      processSingleTodoItem(todoItem);
    } else {
      console.warn(`[InvoiceProcessHandler] Todo item details not found or already complete for aggregateId: ${aggregateId}`);
    }
  });

  console.log('[InvoiceProcessHandler] Finished processing all incomplete todo items');
};

const getTodoItemDetails = (aggregateId) => {
  console.log(`[getTodoItemDetails] Entering function for aggregateId: ${aggregateId}`);
  const allEvents = invoiceEventStore.getEvents();
  console.log(`[getTodoItemDetails] All events retrieved:`, allEvents);

  const event = allEvents.find(event => event.aggregateId === aggregateId && event.type === 'invoiceToRaiseToDoItemAdded');
  console.log(`[getTodoItemDetails] Found event for aggregateId ${aggregateId}:`, event);

  if (!event) {
    console.warn(`[getTodoItemDetails] Event not found for aggregateId: ${aggregateId}`);
    return null;
  }

  const todoItemDetails = {
    aggregateId: event.aggregateId,
    jobId: event.data.jobId,
    payload: event.data.payload,
    toDoComplete: event.data.toDoComplete
  };

  console.log(`[getTodoItemDetails] Returning todo item details:`, todoItemDetails);
  return todoItemDetails;
};

const processSingleTodoItem = (todo) => {
  console.log('[processSingleTodoItem] Entering function for todo item:', todo);

  // Log the jobId separately to ensure it's being captured correctly
  console.log('[processSingleTodoItem] Job ID:', todo.jobId);

  console.log('[InvoiceProcessHandler] Processing todo item:', todo.aggregateId);

  // Check data availability
  const checkResult = checkDataAvailability(todo.payload);
  console.log('[processSingleTodoItem] Data availability check result:', checkResult);

  if (checkResult.result === "ok") {
    // Log the jobId again to ensure it's available at this point
    console.log('[InvoiceProcessHandler] Creating invoice for todo jobId:', todo.jobId);

    // Ensure jobId is defined before proceeding
    if (todo.jobId === undefined) {
      console.error('[InvoiceProcessHandler] jobId is undefined, cannot create invoice.');
      return;
    }

    const invoiceToDoItemClosedEvent = createInvoiceToDoItemClosedEvent(todo.aggregateId, checkResult.dataPayload);
    const invoiceId = uuidv4();
    const { quotationId, amount, currency, description } = checkResult.dataPayload;

    const invoiceRaisedEvent = InvoiceRaisedEvent(
      invoiceId,
      todo.jobId,
      quotationId,
      amount,
      currency,
      description,
      new Date().toISOString(), // createdAt
      'Pending' // status
    );

    console.log('[processSingleTodoItem] Created invoice raised event:', invoiceRaisedEvent);

    invoiceEventStore.append(invoiceToDoItemClosedEvent);
    invoiceEventStore.append(invoiceRaisedEvent);
    eventBus.publish(invoiceRaisedEvent);

    console.log(`[InvoiceProcessHandler] Successfully processed todo ${todo.aggregateId}`);
  } else {
    console.log(`[InvoiceProcessHandler] Missing data for todo: ${todo.aggregateId}, marking as failed with missing info flag`);

    const invoiceToDoItemFailedEvent = createInvoiceToDoItemFailedEvent(todo.aggregateId, {
      dataMissing: checkResult.dataMissing
    });

    console.log('[processSingleTodoItem] Created invoice failed event:', invoiceToDoItemFailedEvent);

    invoiceEventStore.append(invoiceToDoItemFailedEvent);
    eventBus.publish(invoiceToDoItemFailedEvent);

    console.log(`[InvoiceProcessHandler] Marked todo ${todo.aggregateId} as failed: missing information`);
  }
};


const checkDataAvailability = (data) => {
  console.log('[checkDataAvailability] Entering function with data:', data);

  const requiredFields = [
    { name: 'quotationId' },
    { name: 'jobDetails.amount', display: 'amount' },
    { name: 'jobDetails.currency', display: 'currency' },
    { name: 'jobDetails.description', display: 'description' },
    { name: 'jobDetails.title', display: 'title' }
  ];

  const dataMissing = [];

  requiredFields.forEach(field => {
    const keys = field.name.split('.');
    let value = data;

    for (const key of keys) {
      if (value[key] === undefined) {
        value = undefined;
        break;
      }
      value = value[key];
    }

    if (value === undefined) {
      dataMissing.push(field.display || field.name);
    }
  });

  if (dataMissing.length === 0) {
    const result = {
      result: "ok",
      dataMissing: null,
      dataPayload: {
        jobId: data.jobId,
        quotationId: data.quotationId,
        customerId: data.customerId,
        amount: data.jobDetails.amount,
        currency: data.jobDetails.currency,
        description: data.jobDetails.description,
        title: data.jobDetails.title
      }
    };

    console.log('[checkDataAvailability] All required data available:', result);
    return result;
  } else {
    const result = {
      result: "failed",
      dataMissing: dataMissing,
      dataPayload: data
    };

    console.log('[checkDataAvailability] Missing data found:', result);
    return result;
  }
};


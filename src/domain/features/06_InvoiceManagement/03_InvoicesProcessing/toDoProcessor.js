import { eventBus } from '@core/eventBus';
import { invoiceEventStore } from '@core/eventStore';
import { InvoiceRaisedEvent } from '@events/invoiceRaisedEvent';
import { createInvoiceToDoItemClosedEvent } from '../03_InvoicesProcessing/createInvoiceToDoItemClosedEvent';
import { createInvoiceToDoItemFailedEvent } from '../03_InvoicesProcessing/createInvoiceToDoItemFailedEvent';
import { queryToDosProjection, buildLiveModel } from '../02_ProjectionRaisingInvoicesToDo/liveModel';
import { v4 as uuidv4 } from 'uuid';
import {createCloseInvoiceToDoItemCommand} from './createInvoiceToDoItemClosedCommand';

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

  const event = allEvents.find(event =>
    event.aggregateId === aggregateId &&
    event.type === 'invoiceToRaiseToDoItemAdded'
  );

  console.log(`[getTodoItemDetails] Found event for aggregateId ${aggregateId}:`, event);

  if (!event) {
    console.warn(`[getTodoItemDetails] Event not found for aggregateId: ${aggregateId}`);
    return null;
  }

  const todoItemDetails = {
    aggregateId: event.aggregateId,
    requestId: event.requestId,
    changeRequestId: event.changeRequestId,
    jobId: event.data.jobId,
    payload: event.data.payload,
    toDoComplete: event.data.toDoComplete
  };

  console.log(`[getTodoItemDetails] Returning todo item details:`, todoItemDetails);
  return todoItemDetails;
};

const processSingleTodoItem = (todo) => {
  console.log('[processSingleTodoItem] Entering function for todo item:', todo);

  // Check all required data availability
  const checkResult = checkDataAvailability(todo);

  if (checkResult.result === "ok") {
    console.log('[InvoiceProcessHandler] Creating invoice for todo jobId:', todo.jobId);

        // Create a command for closing the to-do item
    const closeInvoiceToDoItemCommand = createCloseInvoiceToDoItemCommand(todo);
    console.log('[InvoiceProcessHandler] Created close invoice to-do command:', closeInvoiceToDoItemCommand);

    // Create the closed event using the command
    const invoiceToDoItemClosedEvent = createInvoiceToDoItemClosedEvent(closeInvoiceToDoItemCommand);
    console.log('[InvoiceProcessHandler] Created invoice to-do item closed event:', invoiceToDoItemClosedEvent);
    
    const invoiceId = uuidv4();
    const { quotationId, amount, currency, description } = checkResult.dataPayload;

    // Create invoice with all required IDs
    const invoiceRaisedEvent = InvoiceRaisedEvent(
      invoiceId,
      todo.requestId,
      todo.changeRequestId,
      todo.jobId,
      quotationId,
      amount,
      currency,
      description,
      new Date().toISOString(), // createdAt
      'Pending' // status
    );

    console.log('[processSingleTodoItem] Created invoice raised event:', invoiceRaisedEvent);

    // Append and publish both events
    invoiceEventStore.append(invoiceToDoItemClosedEvent);
    invoiceEventStore.append(invoiceRaisedEvent);
    eventBus.publish(invoiceRaisedEvent);

    console.log(`[InvoiceProcessHandler] Successfully processed todo ${todo.aggregateId}`);
  } else {
    console.log(`[InvoiceProcessHandler] Missing data for todo: ${todo.aggregateId}, marking as failed with missing info flag`);

    const invoiceToDoItemFailedEvent = createInvoiceToDoItemFailedEvent(
      todo.aggregateId,
      todo.requestId,
      todo.changeRequestId,
      { dataMissing: checkResult.dataMissing }
    );

    console.log('[processSingleTodoItem] Created invoice failed event:', invoiceToDoItemFailedEvent);

    // Only append and publish once
    invoiceEventStore.append(invoiceToDoItemFailedEvent);
    eventBus.publish(invoiceToDoItemFailedEvent);

    console.log(`[InvoiceProcessHandler] Marked todo ${todo.aggregateId} as failed: missing information`);
  }
};

const checkDataAvailability = (todo) => {
  console.log('[checkDataAvailability] Entering function with todo:', todo);

  // Define all required fields including the new root-level IDs
  const requiredFields = [
    { name: 'requestId', source: 'root' },
    { name: 'changeRequestId', source: 'root' },
    { name: 'jobId', source: 'root' },
    { name: 'quotationId', source: 'payload' },
    { name: 'jobDetails.amount', display: 'amount', source: 'payload' },
    { name: 'jobDetails.currency', display: 'currency', source: 'payload' },
    { name: 'jobDetails.description', display: 'description', source: 'payload' },
    { name: 'jobDetails.title', display: 'title', source: 'payload' }
  ];

  const dataMissing = [];

  requiredFields.forEach(field => {
    let value;

    if (field.source === 'root') {
      // Check root level properties
      value = todo[field.name];
    } else {
      // Check nested properties in payload
      const keys = field.name.split('.');
      value = todo.payload;
      for (const key of keys) {
        if (value[key] === undefined) {
          value = undefined;
          break;
        }
        value = value[key];
      }
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
        jobId: todo.jobId,
        quotationId: todo.payload.quotationId,
        customerId: todo.payload.customerId,
        amount: todo.payload.jobDetails.amount,
        currency: todo.payload.jobDetails.currency,
        description: todo.payload.jobDetails.description,
        title: todo.payload.jobDetails.title
      }
    };

    console.log('[checkDataAvailability] All required data available:', result);
    return result;
  } else {
    const result = {
      result: "failed",
      dataMissing: dataMissing,
      dataPayload: todo.payload
    };

    console.log('[checkDataAvailability] Missing data found:', result);
    return result;
  }
};

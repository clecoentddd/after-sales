// completeJob/eventHandler.js
import { eventBus } from '@core/eventBus';
import { invoiceEventStore } from '@core/eventStore';
import { createInvoiceToDoItemAddedEvent } from './createInvoiceToDoItemAddedEvent';
import { v4 as uuidv4 } from 'uuid';

let isInvoiceToDoHandlerInitialized = false;

export const initializeInvoiceToDoHandler = () => {
  if (isInvoiceToDoHandlerInitialized) {
    console.warn('[InvoiceToDoHandler] Already initialized. Skipping re-subscription.');
    return;
  }

  eventBus.subscribe('JobHasBeenCompleted', (event) => {
    console.log(`[InvoiceToDoHandler] Received JobCompleted event:`, event);

    const jobId = event.aggregateId;
    if (!jobId) {
      console.error(`[InvoiceToDoHandler] JobCompleted event missing aggregateId. Cannot create InvoiceToDoItem.`);
      return;
    }

    // Generate unique ID for the todo item
    const todoItemId = uuidv4();
    
    // Create the todo event with the original job event embedded
    const invoiceToDoItemAddedEvent = createInvoiceToDoItemAddedEvent(todoItemId, event);

    console.log(`[InvoiceToDoHandler] Creating todo item ${todoItemId} for job ${jobId}`);
    console.log(`[InvoiceToDoHandler] Todo event payload:`, invoiceToDoItemAddedEvent);

    // Store and publish the event
    invoiceEventStore.append(invoiceToDoItemAddedEvent);
    eventBus.publish(invoiceToDoItemAddedEvent);
    
    console.log(`[InvoiceToDoHandler] Published invoiceToRaiseToDoItemAdded event for job ID: ${jobId}, todo ID: ${todoItemId}`);
  });

  isInvoiceToDoHandlerInitialized = true;
  console.log('[InvoiceToDoHandler] Subscribed to JobCompleted events for InvoiceToDoItem creation.');
};
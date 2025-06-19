// completeJob/eventHandler.js
// This handler subscribes to the 'JobCompleted' event and emits an 'InvoiceCreated' event.
// It acts as a process manager connecting job completion to invoicing.

import { eventBus } from '../../core/eventBus';
import { jobCreationEventStore, startJobEventStore, quotationEventStore, customerEventStore } from '../../core/eventStore';
import { InvoiceAggregate } from '../invoicing/aggregate'; // Import InvoiceAggregate
import { invoiceEventStore } from '../../core/eventStore'; // Import invoiceEventStore

let isCompleteJobEventHandlerInitialized = false;

/**
 * Initializes the complete job event handler by subscribing to relevant events.
 * This function is designed to be idempotent.
 */
export const initializeCompleteJobEventHandler = () => {
  if (isCompleteJobEventHandlerInitialized) {
    console.warn('[CompleteJobEventHandler] Already initialized. Skipping re-subscription.');
    return;
  }

  eventBus.subscribe('JobCompleted', (event) => {
    console.log(`[CompleteJobEventHandler] Received JobCompleted event:`, event);

    const { jobId, completedByUserId, completionDetails } = event.data;

    // To create an invoice, we need to gather information from various sources (read models/event stores)
    const allJobCreationEvents = jobCreationEventStore.getEvents();
    const jobCreated = allJobCreationEvents
      .filter(e => e.type === 'JobCreated' && e.data.jobId === jobId)
      .map(e => e.data)
      .at(0);

    if (!jobCreated) {
      console.error(`[CompleteJobEventHandler] Could not find JobCreated event for ID: ${jobId}. Cannot create invoice.`);
      return;
    }

    const allQuotationEvents = quotationEventStore.getEvents();
    const quotation = allQuotationEvents
      .filter(e => e.type === 'QuotationCreated' && e.data.quotationId === jobCreated.quoteId)
      .map(e => e.data)
      .at(0);

    if (!quotation) {
      console.error(`[CompleteJobEventHandler] Could not find quotation for ID: ${jobCreated.quoteId}. Cannot create invoice.`);
      return;
    }

    const customer = customerEventStore.getEvents()
      .filter(e => e.type === 'CustomerCreated' && e.data.customerId === jobCreated.customerId)
      .map(e => e.data)
      .at(0);

    if (!customer) {
      console.error(`[CompleteJobEventHandler] Could not find customer for ID: ${jobCreated.customerId}. Cannot create invoice.`);
      return;
    }
    
    // Now we have sufficient data to create an invoice
    const invoiceCreatedEvent = InvoiceAggregate.createInvoice(
      jobId,
      quotation.quotationId,
      customer.customerId,
      quotation.quotationDetails.estimatedAmount, // Use amount from the quote
      quotation.quotationDetails.currency,
      jobCreated.jobDetails.title // Use job title for invoice description
    );

    invoiceEventStore.append(invoiceCreatedEvent); // Append to the invoicing event store
    eventBus.publish(invoiceCreatedEvent);
    console.log(`[CompleteJobEventHandler] Published InvoiceCreated event for job ID: ${invoiceCreatedEvent.data.jobId}`); // Corrected line
  });

  isCompleteJobEventHandlerInitialized = true;
  console.log('[CompleteJobEventHandler] Subscribed to JobCompleted events for invoice creation.');
};

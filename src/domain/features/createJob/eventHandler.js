// repair/eventHandler.js
// This handler subscribes to the 'QuoteApproved' event and emits a 'JobCreated' event.
// It acts as a "process manager" orchestrating the creation of a repair job.

import { eventBus } from '../../core/eventBus';
import { jobEventStore, quotationEventStore, customerEventStore, requestEventStore } from '../../core/eventStore'; // Import necessary event stores
import { JobAggregate } from './aggregate';

// Use a flag to ensure the subscription logic runs only once.
let isRepairEventHandlerInitialized = false;

/**
 * Initializes the repair event handler by subscribing to relevant events.
 * This function is designed to be idempotent.
 */
export const initializeRepairEventHandler = () => {
  if (isRepairEventHandlerInitialized) {
    console.warn('[RepairEventHandler] Already initialized. Skipping re-subscription.');
    return; // Prevent duplicate subscriptions
  }

  eventBus.subscribe('QuoteApproved', (event) => {
    console.log(`[RepairEventHandler] Received QuoteApproved event:`, event);

    const { quoteId } = event.data;

    // To create a job, we need more context (customer, request details) than just the quoteId.
    // We'll reconstruct this context from our in-memory read models (event stores).
    // In a real system, this would typically involve querying a projection/read model database.

    const quotation = quotationEventStore.getEvents()
      .filter(e => e.type === 'QuotationCreated')
      .map(e => e.data)
      .find(q => q.quotationId === quoteId);

    if (!quotation) {
      console.error(`[RepairEventHandler] Could not find quotation for ID: ${quoteId}. Cannot create job.`);
      return;
    }

    const request = requestEventStore.getEvents()
      .filter(e => e.type === 'RequestCreated')
      .map(e => e.data)
      .find(r => r.requestId === quotation.requestId);

    if (!request) {
      console.error(`[RepairEventHandler] Could not find request for ID: ${quotation.requestId}. Cannot create job.`);
      return;
    }

    // Now we have all the context needed:
    const customerId = quotation.customerId;
    const requestId = quotation.requestId;
    const requestDetails = request.requestDetails; // Contains title, description etc.

    // Use the JobAggregate to create the new JobCreatedEvent
    const jobCreatedEvent = JobAggregate.createFromQuoteApproval(
      customerId,
      requestId,
      quoteId,
      requestDetails // Pass relevant details from the request
    );

    // Append the new event to the job event store
    jobEventStore.append(jobCreatedEvent);

    // Publish the new JobCreated event to the event bus
    eventBus.publish(jobCreatedEvent);
  });

  isRepairEventHandlerInitialized = true; // Mark as initialized after successful subscription
  console.log('[RepairEventHandler] Subscribed to QuoteApproved events.');
};

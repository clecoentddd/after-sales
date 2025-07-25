// createJob/eventHandler.js
// This handler subscribes to the 'QuoteApproved' event and emits a 'JobCreated' event.

import { eventBus } from '../../core/eventBus';
import { jobEventStore, quotationEventStore, customerEventStore, requestEventStore } from '../../core/eventStore'; // Import necessary event stores
import { JobAggregate } from './aggregate';

let isCreateJobEventHandlerInitialized = false;

/**
 * Initializes the create job event handler by subscribing to relevant events.
 * This function is designed to be idempotent.
 */
export const initializeCreateJobEventHandler = () => {
  if (isCreateJobEventHandlerInitialized) {
    console.warn('[CreateJobEventHandler] Already initialized. Skipping re-subscription.');
    return;
  }

  eventBus.subscribe('QuoteApproved', (event) => {
    console.log(`[CreateJobEventHandler] Received QuoteApproved event:`, event);
    
    // Log the current state of the relevant event stores for debugging
    console.log(`[CreateJobEventHandler] Current quotationEventStore events:`, quotationEventStore.getEvents());
    console.log(`[CreateJobEventHandler] Current requestEventStore events:`, requestEventStore.getEvents());

    const { quoteId } = event.data;
    console.log(`[CreateJobEventHandler] Looking for quotation with ID: ${quoteId}`);

    // Reconstruct the specific quotation state from its events
    const allQuotationEvents = quotationEventStore.getEvents();
    let targetQuotation = allQuotationEvents
      .filter(e => e.type === 'QuotationCreated' && e.data.quotationId === quoteId)
      .map(e => e.data)
      .at(0); // Get the first (and hopefully only) matching quotation created event

    if (!targetQuotation) {
      console.error(`[CreateJobEventHandler] ERROR: Could not find quotation data for ID: ${quoteId}. Cannot create job.`);
      return;
    }
    console.log(`[CreateJobEventHandler] Successfully found quotation:`, targetQuotation);

    console.log(`[CreateJobEventHandler] Looking for request with ID: ${targetQuotation.requestId}`);

    // Reconstruct the specific request state from its events
    const allRequestEvents = requestEventStore.getEvents();
    let targetRequest = allRequestEvents
      .filter(e => e.type === 'RequestCreated' && e.data.requestId === targetQuotation.requestId)
      .map(e => e.data)
      .at(0); // Get the first (and hopefully only) matching request created event

    if (!targetRequest) {
      console.error(`[CreateJobEventHandler] ERROR: Could not find request data for ID: ${targetQuotation.requestId}. Cannot create job.`);
      return;
    }
    console.log(`[CreateJobEventHandler] Successfully found request:`, targetRequest);


    const customerId = targetQuotation.customerId;
    const requestId = targetQuotation.requestId;
    const requestDetails = targetRequest.requestDetails; // Contains title, description etc.

    const jobCreatedEvent = JobAggregate.createFromQuoteApproval(
      customerId,
      requestId,
      quoteId,
      requestDetails
    );

    jobEventStore.append(jobCreatedEvent);
    eventBus.publish(jobCreatedEvent);
    console.log(`[CreateJobEventHandler] Published JobCreated event for job ID: ${jobCreatedEvent.data.jobId}`);
  });

  isCreateJobEventHandlerInitialized = true;
  console.log('[CreateJobEventHandler] Subscribed to QuoteApproved events for job creation.');
};

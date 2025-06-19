// quotation/eventHandler.js
// This handler subscribes to the 'RequestCreated' event and emits a 'QuotationCreated' event.
// This acts as a "process manager" or "saga" orchestrating a reaction to an event.

import { eventBus } from '../../core/eventBus';
import { quotationEventStore } from '../../core/eventStore'; // Ensure this is imported correctly
import { QuotationAggregate } from './aggregate';

// Use a flag to ensure the subscription logic runs only once.
// This prevents multiple subscriptions if initializeQuotationEventHandler is called multiple times,
// for example, in React's Strict Mode development environment.
let isEventHandlerInitialized = false;

/**
 * Initializes the quotation event handler by subscribing to relevant events.
 * This function is designed to be idempotent, meaning calling it multiple times
 * will only result in the event listener being set up once.
 */
export const initializeQuotationEventHandler = () => {
  if (isEventHandlerInitialized) {
    console.warn('[QuotationEventHandler] Already initialized. Skipping re-subscription.');
    return; // Prevent duplicate subscriptions
  }

  eventBus.subscribe('RequestCreated', (event) => {
    console.log(`[QuotationEventHandler] Received RequestCreated event:`, event);

    // Extract necessary data from the RequestCreated event
    const { requestId, customerId, requestDetails } = event.data;

    // Use the QuotationAggregate to create the new QuotationCreatedEvent
    const quotationCreatedEvent = QuotationAggregate.createFromRequest(
      requestId,
      customerId,
      requestDetails
    );

    // Append the new event to the quotation event store
    quotationEventStore.append(quotationCreatedEvent);

    // Publish the new QuotationCreated event to the event bus
    eventBus.publish(quotationCreatedEvent);
  });

  isEventHandlerInitialized = true; // Mark as initialized after successful subscription
  console.log('[QuotationEventHandler] Subscribed to RequestCreated events.');
};

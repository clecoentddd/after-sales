// quotation/processor.js
import { eventBus } from '@core/eventBus';
import { createQuotationCommandHandler } from './commandHandler';

let isEventHandlerInitialized = false;

export const initializeQuotationEventHandler = () => {
  if (isEventHandlerInitialized) return;
  console.log('[QuotationEventHandler] Initializing event handler for RequestRaised events...');  eventBus.subscribe('RequestRaised', (event) => {
    const { requestId, customerId, requestDetails } = event.data;
    createQuotationCommandHandler.handle({ requestId, customerId, requestDetails });
  });

  isEventHandlerInitialized = true;
  console.log('[QuotationEventHandler] Subscribed to RequestRaised.');
};

// quotation/processor.js
import { eventBus } from '../../core/eventBus';
import { createQuotationCommandHandler } from './commandHandler';

let isEventHandlerInitialized = false;

export const initializeQuotationEventHandler = () => {
  if (isEventHandlerInitialized) return;

  eventBus.subscribe('RequestCreated', (event) => {
    const { requestId, customerId, requestDetails } = event.data;
    createQuotationCommandHandler.handle({ requestId, customerId, requestDetails });
  });

  isEventHandlerInitialized = true;
  console.log('[QuotationEventHandler] Subscribed to RequestCreated.');
};

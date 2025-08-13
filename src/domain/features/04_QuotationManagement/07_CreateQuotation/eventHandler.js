// quotation/processor.js
import { eventBus } from '@core/eventBus';
import { createQuotationCommandHandler } from './commandHandler';

let isEventHandlerInitialized = false;

export const initializeQuotationRequestRaisedEventHandler = () => {
  if (isEventHandlerInitialized) return;
  console.log('[QuotationEventHandler] Initializing event handler for RequestRaised events...');  
  eventBus.subscribe('RequestRaised', (event) => {
  const requestId = event.aggregateId;
  const changeRequestId = event.changeRequestId;
  const { customerId, requestDetails } = event.data;
  
  createQuotationCommandHandler.handle({
    requestId,
    changeRequestId,
    customerId,
    requestDetails
  });
});

  isEventHandlerInitialized = true;
  console.log('[QuotationEventHandler] Subscribed to RequestRaised.');
};

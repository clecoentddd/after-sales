import { eventBus } from '@core/eventBus';
import { insertNewQuotation, updateExistingQuotationStatus } from './quotationProjectionUtils';

let quotations = [];
let isEventHandlerInitialized = false;

export const initializeQuotationProjectionEventHandler = () => {
  if (isEventHandlerInitialized) return;

eventBus.subscribe('QuotationCreated', (event) => {
  console.log('[QuotationProjectionHandler] Event received:', event);

  if (!event.aggregateId || !event.data?.requestId || !event.data?.changeRequestId) {
    console.error('[QuotationProjectionHandler] Missing required fields, skipping insertion');
    return;
  }

  const newQuotation = {
    quotationId: event.aggregateId,
    requestId: event.data.requestId,
    changeRequestId: event.data.changeRequestId,
    estimatedAmount: event.data.quotationDetails?.estimatedAmount || 0,
    status: event.data.status || 'Draft',
  };
  
  quotations = insertNewQuotation(quotations, newQuotation);
});

  eventBus.subscribe('QuotationApproved', (event) => {
    console.log(`[QuotationProjectionHandler] Handling QuotationApproved event for quotationId: ${event.aggregateId}`);
    quotations = updateExistingQuotationStatus(quotations, event.aggregateId, 'Approved');
  });

  eventBus.subscribe('QuotationOnHold', (event) => {
    console.log(`[QuotationProjectionHandler] Handling QuotationOnHold event for quotationId: ${event.aggregateId}`);
    quotations = updateExistingQuotationStatus(quotations, event.aggregateId, 'OnHold');
  });

  isEventHandlerInitialized = true;
};

export const queryQuotationsProjection = () => quotations;

export const clearQuotationsProjectionDB = () => {
  quotations = [];
  isEventHandlerInitialized = false;
};

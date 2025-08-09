// domain/features/00_QuotationManagement/08_QuotationListProjection/QuotationCreatedProjectionHandler.js
import { eventBus } from '@core/eventBus';
import { insertNewQuotation } from '../shared/quotationProjectionUtils';
import { queryQuotationsProjection, setQuotationsProjection } from '../shared/quotationProjectionDB';

let isQuotationCreatedHandlerInitialized = false;

export const initializeQuotationCreatedProjectionHandler = () => {
  if (isQuotationCreatedHandlerInitialized) return;

  eventBus.subscribe('QuotationCreated', (event) => {
    console.log('[QuotationCreatedProjectionHandler] Event received:', event);

    if (!event.aggregateId || !event.data?.requestId || !event.data?.changeRequestId) {
      console.error('[QuotationCreatedProjectionHandler] Missing required fields, skipping insertion');
      return;
    }

    const newQuotation = {
      quotationId: event.aggregateId,
      requestId: event.data.requestId,
      changeRequestId: event.data.changeRequestId,
      estimatedAmount: event.data.quotationDetails?.estimatedAmount || 0,
      status: event.data.status || 'Draft',
    };

    const quotations = queryQuotationsProjection();
    const updated = insertNewQuotation(quotations, newQuotation);
    setQuotationsProjection(updated);
  });

  isQuotationCreatedHandlerInitialized = true;
};

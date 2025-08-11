// domain/features/04_QuotationManagement/08_QuotationListProjection/QuotationOnHoldProjectionHandler.js
import { eventBus } from '@core/eventBus';
import { updateExistingQuotationStatus } from '../shared/quotationProjectionUtils';
import { queryQuotationsProjection, setQuotationsProjection } from '../shared/quotationProjectionDB';

let isQuotationOnHoldHandlerInitialized = false;

export const initializeQuotationOnHoldProjectionHandler = () => {
  if (isQuotationOnHoldHandlerInitialized) return;

  eventBus.subscribe('QuotationOnHold', (event) => {
    console.log(`[QuotationOnHoldProjectionHandler] Handling QuotationOnHold event for quotationId: ${event.aggregateId}`);
    const quotations = queryQuotationsProjection();
    const updated = updateExistingQuotationStatus(quotations, event.aggregateId, 'OnHold');
    setQuotationsProjection(updated);
  });

  isQuotationOnHoldHandlerInitialized = true;
};

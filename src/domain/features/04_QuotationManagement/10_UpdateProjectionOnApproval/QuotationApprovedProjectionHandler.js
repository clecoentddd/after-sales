// domain/features/00_QuotationManagement/08_QuotationListProjection/QuotationApprovedProjectionHandler.js
import { eventBus } from '@core/eventBus';
import { updateExistingQuotationStatus } from '../shared/quotationProjectionUtils';
import { queryQuotationsProjection, setQuotationsProjection } from '../shared/quotationProjectionDB';

let isQuotationApprovedHandlerInitialized = false;

export const initializeQuotationApprovedProjectionHandler = () => {
  if (isQuotationApprovedHandlerInitialized) return;

  eventBus.subscribe('QuotationApproved', (event) => {
    console.log(`[QuotationApprovedProjectionHandler] Handling QuotationApproved event for quotationId: ${event.aggregateId}`);
    const quotations = queryQuotationsProjection();
    const updated = updateExistingQuotationStatus(quotations, event.aggregateId, 'Approved');
    setQuotationsProjection(updated);
  });

  isQuotationApprovedHandlerInitialized = true;
};

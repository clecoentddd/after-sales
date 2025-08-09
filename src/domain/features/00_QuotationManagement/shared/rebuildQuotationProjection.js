import { quotationEventStore } from '../../../core/eventStore';
import { insertNewQuotation, updateExistingQuotationStatus } from './quotationProjectionUtils';

export function rebuildQuotationProjection() {
  const events = quotationEventStore.getEvents() || [];
  console.log('[rebuildQuotationProjection] Rebuilding quotation projection with events:', events);
  let quotations = [];

  // Empty the quotations array immediately so UI can reflect this before rebuild starts
  quotations = [];

  // Return a promise that delays rebuilding by 0.5 seconds
  return new Promise((resolve) => {
    setTimeout(() => {
      for (const event of events) {
        const quotationId = event.aggregateId;

        if (event.type === 'QuotationCreated') {
          const newQuotation = {
            quotationId,
            requestId: event.data.requestId,
            changeRequestId: event.data.changeRequestId,
            estimatedAmount: event.data.quotationDetails?.estimatedAmount || 0,
            status: event.data.status || 'Draft',
          };
          console.log(`[rebuildQuotationProjection] Processing QuotationCreated event for quotationId: ${newQuotation}`);
          quotations = insertNewQuotation(quotations, newQuotation);

        } else if (event.type === 'QuotationApproved') {
          quotations = updateExistingQuotationStatus(quotations, quotationId, 'Approved');

        } else if (event.type === 'QuotationOnHold') {
          quotations = updateExistingQuotationStatus(quotations, quotationId, 'OnHold');
        }
      }
      resolve(quotations);
    }, 500); // 500ms delay
  });
}

// src/domain/features/Quotation/events/enrichedQuotationEvent.js

export const quotationApprovedEnrichedEvent = (aggregate, userId) => {
  return {
    type: 'QuotationHasBeenApproved',
    quotationId: aggregate.quotationId,
    aggregateType: "Quotation",
    data: {
      requestId: aggregate.requestId,
      changeRequestId: aggregate.changeRequestId,
      quotationDetails: aggregate.quotationDetails,
      quotationStatus: aggregate.status,
      approvedByUserId: userId,
      approvedAt: new Date().toISOString(),
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  };
};

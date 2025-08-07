export const QuotationCreatedEvent = ({
  quotationId,
  requestId,
  changeRequestId,
  customerId,
  quotationDetails,
  status = 'Draft',
}) => ({
  type: 'QuotationCreated',
  aggregateId: quotationId,
  data: {
    requestId,
    changeRequestId, // ✅ FIX: Include this!
    customerId,
    quotationDetails,
    status,
  },
  metadata: {
    timestamp: new Date().toISOString(),
  },
});

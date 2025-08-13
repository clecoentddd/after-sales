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
  aggregateType: 'Quotation',
  requestId,
  changeRequestId,
  data: {
    customerId,
    quotationDetails,
    status,
  },
  metadata: {
    timestamp: new Date().toISOString(),
  },
});

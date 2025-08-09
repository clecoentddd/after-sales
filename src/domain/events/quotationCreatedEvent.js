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
  data: {
    requestId,
    changeRequestId,
    customerId,
    quotationDetails,
    status,
  },
  metadata: {
    timestamp: new Date().toISOString(),
  },
});

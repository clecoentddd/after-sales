export const RequestCreatedEvent = (requestId, customerId, requestDetails, status = 'Pending') => ({
  type: 'RequestCreated',
  aggregateType: "Request",
  data: {
    requestId,
    customerId,
    requestDetails,
    status,
  },
  metadata: {
    timestamp: new Date().toISOString(),
  },
});

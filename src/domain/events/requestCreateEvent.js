export const RequestCreatedEvent = (requestId, customerId, requestDetails, status = 'Pending') => ({
  type: 'RequestCreated',
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

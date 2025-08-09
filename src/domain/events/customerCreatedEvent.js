export const CustomerCreatedEvent = (customerId, name, organizationId) => ({
  type: 'CustomerCreated',
  aggregateId: customerId,
  data: {
    organizationId,
    name,
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});
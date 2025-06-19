export const CustomerCreatedEvent = (customerId, name, organizationId) => ({
  type: 'CustomerCreated',
  data: {
    customerId,
    name,
    organizationId
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});
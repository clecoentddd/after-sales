export const CustomerCreatedEvent = (customerId, name, organizationId) => ({
  type: 'CustomerCreated',
  aggregateId: customerId,
 aggregateType: "Customer",
  data: {
    organizationId,
    name,
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});
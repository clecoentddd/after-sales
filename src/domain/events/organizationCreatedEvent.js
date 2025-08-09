export const organizationCreatedEvent = (organizationId, name) => ({
  type: 'OrganizationCreated',
  aggregateId: organizationId,
  aggregateType: 'Organization',
  data: {
    name
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});
export const OrganizationCreatedEvent = (organizationId, name) => ({
  type: 'OrganizationCreated',
  data: {
    organizationId,
    name
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});
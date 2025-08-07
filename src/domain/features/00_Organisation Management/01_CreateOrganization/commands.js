export const CreateOrganizationCommand = (organizationId, name) => ({
  type: 'CreateOrganization',
  organizationId,
  name
});
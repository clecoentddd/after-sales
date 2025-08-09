// domain/features/02_CreateCustomer/commands.js
export const CreateCustomerCommand = (customerId, name, organizationId) => ({
  type: 'CreateCustomer',
  customerId,
  name,
  organizationId
});
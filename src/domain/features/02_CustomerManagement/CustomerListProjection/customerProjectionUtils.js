export function insertNewCustomer(customers, newCustomer) {
  if (!newCustomer.customerId || !newCustomer.name || !newCustomer.organizationId) {
    throw new Error('Invalid customer data: must include customerId, name, and organizationId');
  }

  if (customers.some(c => c.customerId === newCustomer.customerId)) {
    return customers;
  }

  return [...customers, newCustomer];
}

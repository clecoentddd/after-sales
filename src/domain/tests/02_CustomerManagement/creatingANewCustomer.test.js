import { createCustomerCommandHandler } from '../../features/02_CustomerManagement/CreateCustomer/commandHandler';

describe('Customer creation', () => {
  it('should create a customer event with correct schema', () => {
    const command = {
      name: 'Alice',
      organizationId: 'org-1234'
    };

    const result = createCustomerCommandHandler.handle(command);

    expect(result.success).toBe(true);
    expect(result.event).toBeDefined();

    const event = result.event;

    expect(event.type).toBe('CustomerCreated');
    expect(typeof event.aggregateId).toBe('string');
    expect(event.aggregateId.length).toBeGreaterThan(0);

    // event.data has customerId and name only
    expect(event.data.organizationId).toBe(command.organizationId);
    expect(event.data.name).toBe(command.name);
    expect(event.aggregateId).toBeDefined();
    // organizationId is NOT inside event.data per your schema, so no test here

    expect(event.metadata).toHaveProperty('timestamp');
  });
});
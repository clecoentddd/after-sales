import { rebuildCustomerProjection } from '../../features/02_CustomerManagement/CustomerListProjection/rebuildCustomerProjection';
import { customerEventStore } from '@core/eventStore';

describe('Customer projection rebuild', () => {
  beforeEach(() => {
    // Clear event store before each test
    //customerEventStore.clearEvents();
  });

  it('should rebuild customers projection from 3 CustomerCreated events', () => {
    // Prepare mock events
    const events = [
      {
        type: 'CustomerCreated',
        aggregateId: 'cust-1',
        data: {  name: 'Alice', organizationId: 'org-1' },
        metadata: { timestamp: new Date().toISOString() },
      },
      {
        type: 'CustomerCreated',
        aggregateId: 'cust-2',
        data: { name: 'Bob', organizationId: 'org-1' },
        metadata: { timestamp: new Date().toISOString() },
      },
      {
        type: 'CustomerCreated',
        aggregateId: 'cust-3',
        data: { customerId: 'cust-3', name: 'Charlie', organizationId: 'org-2' },
        metadata: { timestamp: new Date().toISOString() },
      },
    ];

    // Add events to the store
    events.forEach(event => customerEventStore.append(event));

    // Rebuild projection
    const customers = rebuildCustomerProjection();

    // Assertions
    expect(customers).toHaveLength(3);
    expect(customers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ customerId: 'cust-1', name: 'Alice', organizationId: 'org-1' }),
        expect.objectContaining({ customerId: 'cust-2', name: 'Bob', organizationId: 'org-1' }),
        expect.objectContaining({ customerId: 'cust-3', name: 'Charlie', organizationId: 'org-2' }),
      ])
    );
  });
});

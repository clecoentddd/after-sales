import { eventBus } from '@core/eventBus';
import { 
  initializeCustomerProjectionEventHandler, 
  clearCustomersProjectionDB,
  queryCustomersProjection,
} from '../../features/02_CustomerManagement/CustomerListProjection/customerProjectionHandler'; 

describe('CustomerEventHandler', () => {
  beforeEach(() => {
    clearCustomersProjectionDB();
  });

  it('should update customers and customerEvents on CustomerCreated events', () => {
    initializeCustomerProjectionEventHandler();

const event1 = {
  type: 'CustomerCreated',
  aggregateId: 'c1',
  data: { 
    name: 'Alice', 
    organizationId: 'org1' 
  },
  metadata: { timestamp: new Date().toISOString() },
};

const event2 = {
  type: 'CustomerCreated',
  aggregateId: 'c2',
  data: { 
    organizationId: 'org2' ,
    name: 'Bob', 
  },
  metadata: { timestamp: new Date().toISOString() },
};

    eventBus.publish(event1);
    eventBus.publish(event2);

    const customers = queryCustomersProjection();


    expect(customers).toHaveLength(2);
    expect(customers.find(c => c.customerId === 'c1').name).toBe('Alice');
    expect(customers.find(c => c.customerId === 'c2').name).toBe('Bob');

  });
});

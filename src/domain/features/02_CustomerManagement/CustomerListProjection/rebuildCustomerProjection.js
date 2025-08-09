import { customerEventStore } from '../../../core/eventStore';
import { insertNewCustomer } from './customerProjectionUtils';

export function rebuildCustomerProjection() {
  const events = customerEventStore.getEvents() || [];
  let customers = [];

  // Empty the customers array immediately so UI can reflect this before rebuild starts
  customers = [];

  // Return a promise that delays rebuilding by 0.5 seconds
  return new Promise((resolve) => {
    setTimeout(() => {
      for (const event of events) {
        if (event.type === 'CustomerCreated') {
          const customer = {
            customerId: event.aggregateId,
            ...event.data
          };
          customers = insertNewCustomer(customers, customer);
        }
      }
      resolve(customers);
    }, 500); // 500ms delay
  });
}

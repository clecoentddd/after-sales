import { eventBus } from '@core/eventBus';
import { insertNewCustomer } from './customerProjectionUtils';

let customers = [];
let isEventHandlerInitialized = false;

export const initializeCustomerProjectionEventHandler = () => {
  if (isEventHandlerInitialized) return;

  eventBus.subscribe('CustomerCreated', (event) => {
    const customer = {
      customerId: event.aggregateId,
      ...event.data
    };
    console.log(`[CustomerProjectionHandler] Handling CustomerCreated event for customerId: ${event.aggregateId}`);
    customers = insertNewCustomer(customers, customer);
  });

  isEventHandlerInitialized = true;
};

export const queryCustomersProjection = () => customers;

export const clearCustomersProjectionDB = () => {
  customers = [];
  isEventHandlerInitialized = false;
};

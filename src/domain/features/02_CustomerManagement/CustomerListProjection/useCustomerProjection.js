// domain/features/02_CustomerManagement/04_CustomerListProjection/useCustomerProjection.js

import { useState, useEffect } from 'react';
import { eventBus } from '@core/eventBus';
import {
  initializeCustomerProjectionEventHandler,
  queryCustomersProjection
} from './customerProjectionHandler';

export function useCustomerProjection() {
  // ✅ Initialize projection handler once
  initializeCustomerProjectionEventHandler();

  // Projection state
  const [customers, setCustomers] = useState(queryCustomersProjection());

  useEffect(() => {
    const unsubscribe = eventBus.subscribe('CustomerCreated', () => {
      setCustomers(queryCustomersProjection());
    });

    return () => unsubscribe();
  }, []);

  return { customers };
}

import { useState, useEffect } from 'react';
import { customerEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

export function useCustomerEvents() {
  const [customerEvents, setCustomerEvents] = useState(customerEventStore.getEvents());

  useEffect(() => {
    // Subscribe to any customer-related events
    const unsubCreate = eventBus.subscribe('CustomerCreated', () => {
      setCustomerEvents(customerEventStore.getEvents());
    });

    // If you have more events like CustomerUpdated, add them here
    // const unsubUpdate = eventBus.subscribe('CustomerUpdated', ...)

    return () => {
      unsubCreate();
      // unsubUpdate();
    };
  }, []);

  return { customerEvents };
}

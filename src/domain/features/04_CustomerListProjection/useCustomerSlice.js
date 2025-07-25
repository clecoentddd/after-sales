import { useEffect, useState } from 'react';
import { customerEventStore } from '../../core/eventStore';
import { eventBus } from '../../core/eventBus';

export function useCustomerSlice() {
  const [customers, setCustomers] = useState([]);
  const [customerEvents, setCustomerEvents] = useState([]);

  useEffect(() => {
    const loadedEvents = customerEventStore.getEvents();
    setCustomerEvents(loadedEvents);
    const created = loadedEvents.filter(e => e.type === 'CustomerCreated').map(e => e.data);
    setCustomers(created);
  }, []);

  useEffect(() => {
    const unsub = eventBus.subscribe('CustomerCreated', (event) => {
      setCustomers(prev => [...prev, event.data]);
      setCustomerEvents(prev => [...prev, event]);
    });
    return () => unsub();
  }, []);

  return { customers, customerEvents };
}

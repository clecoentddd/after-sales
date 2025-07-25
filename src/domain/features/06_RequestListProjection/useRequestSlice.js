import { useEffect, useState } from 'react';
import { requestEventStore } from '../../core/eventStore';
import { eventBus } from '../../core/eventBus';

export function useRequestSlice() {
  const [requests, setRequests] = useState([]);
  const [requestEvents, setRequestEvents] = useState([]);

  useEffect(() => {
    const loadedEvents = requestEventStore.getEvents();
    setRequestEvents(loadedEvents);
    const created = loadedEvents.filter(e => e.type === 'RequestCreated').map(e => e.data);
    setRequests(created);
  }, []);

  useEffect(() => {
    const unsub = eventBus.subscribe('RequestCreated', (event) => {
      setRequests(prev => [...prev, event.data]);
      setRequestEvents(prev => [...prev, event]);
    });
    return () => unsub();
  }, []);

  return { requests, requestEvents };
}

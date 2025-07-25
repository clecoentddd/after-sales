import { useEffect, useState } from 'react';
import { changeRequestEventStore } from '../../core/eventStore';
import { eventBus } from '../../core/eventBus';

export function useChangeRequestSlice() {
  const [changeRequests, setChangeRequests] = useState([]);
  const [changeRequestEvents, setChangeRequestEvents] = useState([]);

  // Load initial ChangeRequestRaised events and reconstruct state
  useEffect(() => {
    const events = changeRequestEventStore.getEvents();
    setChangeRequests(events.filter(e => e.type === 'ChangeRequestRaised').map(e => e.data));
    setChangeRequestEvents(events);
  }, []);

  // Subscribe to ChangeRequestRaised events for real-time updates
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('ChangeRequestRaised', (event) => {
      setChangeRequests(prev => [...prev, event.data]);
      setChangeRequestEvents(prev => [...prev, event]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    changeRequests,
    changeRequestEvents,
  };
}

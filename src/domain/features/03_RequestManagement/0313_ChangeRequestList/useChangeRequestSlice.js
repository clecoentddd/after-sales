import { useEffect, useState } from 'react';
import { requestEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

export function useChangeRequestSlice() {
  const [changeRequests, setChangeRequests] = useState([]);
  const [changeRequestEvents, setChangeRequestEvents] = useState([]);

  // Load initial ChangeRequestRaised events and reconstruct state
  useEffect(() => {
    const events = requestEventStore.getEvents();
    setChangeRequests(
      events
        .filter(e => e.type === 'ChangeRequestRaised')
        .map(e => ({
          ...e.data,
          requestId: e.aggregateId
        }))
      );
    setChangeRequestEvents(events);
  }, []);

  // Subscribe to ChangeRequestRaised events for real-time updates
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('ChangeRequestRaised', (event) => {
      console.log('[DEBUG] useChangeRequestSlice received:', JSON.stringify(event, null, 2));

      const newRequest = {
        ...event.data,
        requestId: event.aggregateId
      };
      setChangeRequests(prev => [...prev, newRequest]);
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

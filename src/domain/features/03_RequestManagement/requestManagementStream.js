// domain/features/03_RequestManagement/requestManagementStream.js
import { useState, useEffect } from 'react';
import { eventBus } from '@core/eventBus';
import { requestEventStore } from '@core/eventStore';

export function useRequestEvents() {
  const [requestEvents, setRequestEvents] = useState(
    requestEventStore.getEvents().filter(e =>
      ['RequestRaised', 'RequestClosed'].includes(e.type)
    )
  );

  useEffect(() => {
    const unsubscribes = [
      eventBus.subscribe('RequestRaised', (event) => {
        setRequestEvents(prev => [...prev, event]);
      }),
      eventBus.subscribe('RequestClosed', (event) => {
        setRequestEvents(prev => [...prev, event]);
      }),
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  return { requestEvents };
}

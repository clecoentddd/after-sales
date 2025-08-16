// domain/features/05_RepairJobManagement/repairJobManagementStream.js
import { useState, useEffect } from 'react';
import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore';

export function useJobEvents() {
  const [jobEvents, setJobEvents] = useState(
    jobEventStore.getEvents().filter(e =>
      ['JobCreated', 'JobStarted', 'JobCompleted'].includes(e.type)
    )
  );

  useEffect(() => {
    const unsubscribes = [
      eventBus.subscribe('JobCreated', (event) => {
        setJobEvents(prev => [...prev, event]);
      }),
      eventBus.subscribe('JobStarted', (event) => {
        setJobEvents(prev => [...prev, event]);
      }),
      eventBus.subscribe('JobCompleted', (event) => {
        setJobEvents(prev => [...prev, event]);
      })
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  return { jobEvents };
}

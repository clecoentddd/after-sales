import { useEffect, useState } from 'react';
import { jobEventStore } from '../../core/eventStore';

import { eventBus } from '../../core/eventBus';

export function useRepairJobSlice() {
  const [repairJobs, setRepairJobs] = useState([]);
  const [repairJobEvents, setRepairJobEvents] = useState([]);

  useEffect(() => {
    const events = [
      ...(jobEventStore.getEvents() || []),
    ];

    const jobMap = new Map();

    for (const event of events) {
      const { jobId, ...data } = event.data;

      switch (event.type) {
        case 'JobCreated':
          jobMap.set(jobId, { jobId, ...data });
          break;
        case 'JobStarted':
          if (jobMap.has(jobId)) {
            jobMap.get(jobId).status = data.status;
          }
          break;
        case 'JobCompleted':
          if (jobMap.has(jobId)) {
            jobMap.get(jobId).status = 'Completed';
          }
          break;
        case 'JobOnHold':
          if (jobMap.has(jobId)) {
            jobMap.get(jobId).status = 'On Hold';
          }
          break;
        default:
          break;
      }
    }

    setRepairJobs(Array.from(jobMap.values()));
    setRepairJobEvents(events);
  }, []);

  useEffect(() => {
    const unsubscribers = [
      eventBus.subscribe('JobCreated', (event) => {
         setRepairJobs(prev => [...prev, { ...event.data }]);
        setRepairJobEvents(prev => [...prev, event]);
      }),
      eventBus.subscribe('JobStarted', (event) => {
        setRepairJobs(prev =>
          prev.map(job =>
            job.jobId === event.data.jobId
              ? { ...job, status: event.data.status }
              : job
          )
        );
        setRepairJobEvents(prev => [...prev, event]);
      }),
      eventBus.subscribe('JobCompleted', (event) => {
        setRepairJobs(prev =>
          prev.map(job =>
            job.jobId === event.data.jobId
              ? { ...job, status: 'Completed' }
              : job
          )
        );
        setRepairJobEvents(prev => [...prev, event]);
      }),
      eventBus.subscribe('JobOnHold', (event) => {
        setRepairJobs(prev =>
          prev.map(job =>
            job.jobId === event.data.jobId
              ? { ...job, status: 'On Hold' }
              : job
          )
        );
        setRepairJobEvents(prev => [...prev, event]);
      })
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  return {
    jobs: repairJobs || [],
    jobEvents: repairJobEvents || []
  };
}

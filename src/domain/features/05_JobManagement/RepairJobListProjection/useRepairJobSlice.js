import { useEffect, useState } from 'react';
import { jobEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

export function useRepairJobSlice() {
  const [repairJobs, setRepairJobs] = useState([]);
  const [repairJobEvents, setRepairJobEvents] = useState([]);

  useEffect(() => {
    const events = [...(jobEventStore.getEvents() || [])];
    const jobMap = new Map();

    for (const event of events) {
      const jobId = event.aggregateId; // Use aggregateId as jobId
      const data = event.data;

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
            jobMap.get(jobId).status = 'OnHold';
          }
          break;
        case 'ChangeRequestReceivedPendingAssessment':
          if (jobMap.has(jobId)) {
            jobMap.get(jobId).status = 'ChangeRequestReceivedPendingAssessment';
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
    const handleJobCreated = (event) => {
      const jobId = event.aggregateId;
      setRepairJobs(prev => [...prev, { jobId, ...event.data }]);
      setRepairJobEvents(prev => [...prev, event]);
    };

    const handleJobStatusChange = (event) => {
      const jobId = event.aggregateId;
      setRepairJobs(prev =>
        prev.map(job =>
          job.jobId === jobId
            ? { ...job, status: event.type === 'JobStarted' ? event.data.status : event.type === 'JobCompleted' ? 'Completed' : 'OnHold' }
            : job
        )
      );
      setRepairJobEvents(prev => [...prev, event]);
    };

    const unsubscribers = [
      eventBus.subscribe('JobCreated', handleJobCreated),
      eventBus.subscribe('JobStarted', handleJobStatusChange),
      eventBus.subscribe('JobCompleted', handleJobStatusChange),
      eventBus.subscribe('JobOnHold', handleJobStatusChange),
      eventBus.subscribe('ChangeRequestReceivedPendingAssessment', (event) => {
        const jobId = event.aggregateId;
        setRepairJobs(prev =>
          prev.map(job =>
            job.jobId === jobId
              ? { ...job, status: 'ChangeRequestReceivedPendingAssessment' }
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

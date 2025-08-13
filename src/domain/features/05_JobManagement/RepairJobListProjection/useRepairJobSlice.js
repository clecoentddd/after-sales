import { useEffect, useState } from 'react';
import { jobEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

export function useRepairJobSlice() {
  const [repairJobs, setRepairJobs] = useState([]);
  const [repairJobEvents, setRepairJobEvents] = useState([]);

  useEffect(() => {
    const events = [...(jobEventStore.getEvents() || [])];
    console.log('[useRepairJobSlice] Initial events:', events);

    const jobMap = new Map();

    for (const event of events) {
      const jobId = event.aggregateId;
      const data = event.data;

      switch (event.type) {
        case 'JobCreated':
          jobMap.set(jobId, { jobId, ...data });
          break;
        case 'JobStarted':
          if (jobMap.has(jobId)) jobMap.get(jobId).status = data.status;
          break;
        case 'JobCompleted':
          if (jobMap.has(jobId)) jobMap.get(jobId).status = 'Completed';
          break;
        case 'JobOnHold':
          if (jobMap.has(jobId)) jobMap.get(jobId).status = 'OnHold';
          break;
        case 'ChangeRequestReceivedPendingAssessment':
          if (jobMap.has(jobId)) jobMap.get(jobId).status = 'ChangeRequestReceivedPendingAssessment';
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
      console.log('[useRepairJobSlice] JobCreated received:', event);
      const jobId = event.aggregateId;
      setRepairJobs(prev => [...prev, { jobId, ...event.data }]);
      setRepairJobEvents(prev => [...prev, event]);
    };

    const handleJobStatusChange = (event) => {
      console.log('[useRepairJobSlice] Status change event received:', event);

      const jobId = event.aggregateId;
      const newStatus =
        event.type === 'JobStarted'
          ? event.data.status
          : event.type === 'JobCompleted'
          ? 'Completed'
          : 'OnHold';

      setRepairJobs(prev =>
        prev.map(job =>
          job.jobId === jobId ? { ...job, status: newStatus } : job
        )
      );
      setRepairJobEvents(prev => [...prev, event]);
    };

    const handleCustomChangeStatus = (event) => {
      console.log('[useRepairJobSlice] Custom status event received:', event);
      const jobId = event.aggregateId;
      setRepairJobs(prev =>
        prev.map(job =>
          job.jobId === jobId
            ? { ...job, status: 'ChangeRequestReceivedPendingAssessment' }
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
      eventBus.subscribe('ChangeRequestReceivedPendingAssessment', handleCustomChangeStatus)
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  useEffect(() => {
    console.log('[useRepairJobSlice] repairJobs updated:', repairJobs);
  }, [repairJobs]);

  return {
    jobs: repairJobs || [],
    jobEvents: repairJobEvents || []
  };
}

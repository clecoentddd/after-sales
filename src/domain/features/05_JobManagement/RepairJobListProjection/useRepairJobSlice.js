import { useEffect, useState } from 'react';
import { RepairJobProjection } from './RepairJobProjection';
import { jobEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

export function useRepairJobSlice() {
  const [repairJobs, setRepairJobs] = useState([]);

  // Rebuild projection from existing events
  const rebuildProjection = async () => {
    await RepairJobProjection.rebuild(); // uses jobEventStore.getEvents internally
    setRepairJobs(Object.values(RepairJobProjection.getAll?.() || {})); 
  };

  // Subscribe to eventBus for live updates
  useEffect(() => {
    const handleEvent = (event) => {
      RepairJobProjection.handleEvent(event);
      setRepairJobs(Object.values(RepairJobProjection.getAll?.() || {}));
    };

    // subscribe to job-related events
    const unsubJobCreated = eventBus.subscribe('JobCreated', handleEvent);
    const unsubJobStarted = eventBus.subscribe('JobStarted', handleEvent);
    const unsubJobCompleted = eventBus.subscribe('JobCompleted', handleEvent);

    // rebuild on mount
    rebuildProjection();

    return () => {
      unsubJobCreated();
      unsubJobStarted();
      unsubJobCompleted();
    };
  }, []);

  return { jobs: repairJobs, rebuildProjection };
}

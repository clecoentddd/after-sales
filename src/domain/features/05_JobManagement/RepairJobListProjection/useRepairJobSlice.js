import { useEffect, useState } from 'react';
import { JobCreatedProjection } from '../0502_JobCreatedProjection/JobCreatedProjection';
import { JobStartedProjection } from '../0504_StartedJobProjection/JobStartedProjection';
import { JobCompletedProjection } from '../0506_CompletedJobProjection/JobCompletedProjection';

export function useRepairJobSlice() {
  const [createdJobs, setCreatedJobs] = useState([]);
  const [startedJobs, setStartedJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);

  const rebuildProjection = async () => {
    console.log('[useRepairJobSlice] Starting rebuild of all projections...');
    await Promise.all([
      JobCreatedProjection.rebuild(),
      JobStartedProjection.rebuild(),
      JobCompletedProjection.rebuild()
    ]);
    console.log('[useRepairJobSlice] Projections rebuilt.');

    const created = JobCreatedProjection.getAll();
    const started = JobStartedProjection.getAll();
    const completed = JobCompletedProjection.getAll();

    console.log('[useRepairJobSlice] getAll results -> created:', created);
    console.log('[useRepairJobSlice] getAll results -> started:', started);
    console.log('[useRepairJobSlice] getAll results -> completed:', completed);

    setCreatedJobs(created);
    setStartedJobs(started);
    setCompletedJobs(completed);
  };

  useEffect(() => {
    console.log('[useRepairJobSlice] Subscribing to projections...');

    const unsubCreated = JobCreatedProjection.subscribe(data => {
      console.log('[useRepairJobSlice] JobCreatedProjection subscriber fired', data);
      setCreatedJobs(data);
    });

    const unsubStarted = JobStartedProjection.subscribe(data => {
      console.log('[useRepairJobSlice] JobStartedProjection subscriber fired', data);
      setStartedJobs(data);
    });

    const unsubCompleted = JobCompletedProjection.subscribe(data => {
      console.log('[useRepairJobSlice] JobCompletedProjection subscriber fired', data);
      setCompletedJobs(data);
    });

    // Rebuild after subscribing so subscribers get replayed events
    rebuildProjection();

    return () => {
      console.log('[useRepairJobSlice] Unsubscribing from projections...');
      unsubCreated?.();
      unsubStarted?.();
      unsubCompleted?.();
    };
  }, []);

  // Combine all jobs for convenience
  const jobs = [...createdJobs, ...startedJobs, ...completedJobs];
  console.log('[useRepairJobSlice] Combined jobs state:', jobs);

  return {
    jobs,
    rebuildProjection,
  };
}

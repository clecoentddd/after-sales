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
    try {
      // Reset state before rebuilding to show loading state
      setCreatedJobs([]);
      setStartedJobs([]);
      setCompletedJobs([]);

      await Promise.all([
        JobCreatedProjection.rebuild(),
        JobStartedProjection.rebuild(),
        JobCompletedProjection.rebuild()
      ]);

      // Get fresh data after rebuild
      const created = JobCreatedProjection.getAll();
      const started = JobStartedProjection.getAll();
      const completed = JobCompletedProjection.getAll();

      console.log('[useRepairJobSlice] Rebuild results:',
        { created: created.length, started: started.length, completed: completed.length });

      setCreatedJobs(created);
      setStartedJobs(started);
      setCompletedJobs(completed);

      console.log('[useRepairJobSlice] Projections rebuilt successfully.');
    } catch (error) {
      console.error('[useRepairJobSlice] Error rebuilding projections:', error);
      // Optionally rethrow or handle the error
    }
  };

  useEffect(() => {
    console.log('[useRepairJobSlice] Subscribing to projections...');

    const unsubCreated = JobCreatedProjection.subscribe(data => {
      console.log('[useRepairJobSlice] JobCreatedProjection updated:', data.length, 'jobs');
      setCreatedJobs(data);
    });

    const unsubStarted = JobStartedProjection.subscribe(data => {
      console.log('[useRepairJobSlice] JobStartedProjection updated:', data.length, 'jobs');
      setStartedJobs(data);
    });

    const unsubCompleted = JobCompletedProjection.subscribe(data => {
      console.log('[useRepairJobSlice] JobCompletedProjection updated:', data.length, 'jobs');
      setCompletedJobs(data);
    });

    // Initial rebuild
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
  console.log('[useRepairJobSlice] Current combined jobs state:', jobs.length, 'total jobs');

  return {
    jobs,
    createdJobs,
    startedJobs,
    completedJobs,  // Expose individual job lists if needed
    rebuildProjection,
  };
}

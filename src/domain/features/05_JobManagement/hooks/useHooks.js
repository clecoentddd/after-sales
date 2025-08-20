import { useState, useEffect } from 'react';

export function useProjection(projection) {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    // Get current state from projection
    setJobs(projection.getAll());

    // Subscribe to future updates
    const unsubscribe = projection.subscribe((data) => {
      setJobs(data);
    });

    return () => {
      unsubscribe();
    };
  }, [projection]);

  return {
    jobs
  };
}

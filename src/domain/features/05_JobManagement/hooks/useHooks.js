// src/domain/features/05_JobManagement/hooks/useProjection.js
import { useEffect, useState } from "react";

export function useProjection(projection) {
  const [jobs, setJobs] = useState([]);

  const rebuildProjection = async () => {
    await projection.rebuild();
    setJobs(projection.getAll());
  };

  useEffect(() => {
    const unsub = projection.subscribe(setJobs);
    rebuildProjection();
    return () => unsub();
  }, [projection]);

  return { jobs, rebuildProjection };
}

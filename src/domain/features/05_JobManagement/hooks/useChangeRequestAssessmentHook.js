// features/05_JobManagement/useJobManagement.js
import { useEffect } from 'react';
import { initializeChangeRequestAssessmentManager } from '../initializers/initializeChangeRequestAssessmentManager';

export function useChangeRequestAssessementJobManagement() {
  useEffect(() => {
    const unsubscribe = initializeChangeRequestAssessmentManager();
    return () => {
      unsubscribe();
    };
  }, []);
}
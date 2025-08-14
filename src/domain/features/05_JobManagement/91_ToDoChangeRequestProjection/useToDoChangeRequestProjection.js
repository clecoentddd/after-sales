// useToDoChangeRequestProjection.js
import { useEffect } from 'react';
import { initializeAssignJobToChangeRequestProcessor } from '../90_AssignJobToChangeRequest/initializeAssignJobToChangeRequestProcessor';

export function useToDoChangeRequestProjection() {
  useEffect(() => {
    console.log('[useToDoChangeRequestProjection] Initializing todo projection...'); // Debug log
    const unsubscribe = initializeAssignJobToChangeRequestProcessor();
    console.log('[useToDoChangeRequestProjection] Todo projection initialized.'); // Debug log
    return () => {
      if (unsubscribe) {
        console.log('[useToDoChangeRequestProjection] Unsubscribing from todo projection...'); // Debug log
        unsubscribe();
      }
    };
  }, []);
}

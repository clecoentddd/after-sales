// useRequestClosedProjection.js
import { useState, useEffect } from 'react';
import { eventBus } from '@core/eventBus';
import { queryClosedRequests } from '../shared/requestProjectionDB';

export function useRequestClosedProjection() {
  const [closedRequests, setClosedRequests] = useState(() =>
    queryClosedRequests()
  );

  useEffect(() => {
    const update = () => setClosedRequests(queryClosedRequests());

    const unsubscribe = eventBus.subscribe('RequestClosed', update);

    update(); // initial sync

    return () => unsubscribe();
  }, []);

  return { closedRequests };
}

// Expose event subscription and query functions
export function subscribeClosedRequests(onUpdate) {
  const unsubscribe = eventBus.subscribe('RequestClosed', onUpdate);
  onUpdate();
  return unsubscribe;
}

export function getClosedRequests() {
  return queryClosedRequests();
}

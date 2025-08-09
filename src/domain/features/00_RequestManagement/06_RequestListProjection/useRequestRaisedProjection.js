// useRequestRaisedProjection.js
import { useState, useEffect } from 'react';
import { eventBus } from '@core/eventBus';
import { queryRaisedRequests } from '../shared/requestProjectionDB';

export function useRequestRaisedProjection() {
  const [raisedRequests, setRaisedRequests] = useState(() =>
    queryRaisedRequests()
  );

  useEffect(() => {
    const update = () => setRaisedRequests(queryRaisedRequests());

    const unsubscribe = eventBus.subscribe('RequestRaised', update);

    update(); // initial sync

    return () => unsubscribe();
  }, []);

  return { raisedRequests };
}

// Expose event subscription and query functions
export function subscribeRaisedRequests(onUpdate) {
  const unsubscribe = eventBus.subscribe('RequestRaised', onUpdate);
  onUpdate();
  return unsubscribe;
}

export function getRaisedRequests() {
  return queryRaisedRequests();
}

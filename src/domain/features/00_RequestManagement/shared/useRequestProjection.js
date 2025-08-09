// useRequestProjection.js
import { useState, useEffect } from 'react';
import { subscribeRaisedRequests, getRaisedRequests } from '../06_RequestListProjection/useRequestRaisedProjection';
import { subscribeClosedRequests, getClosedRequests } from '../28_ProjectionClosedRequest/useRequestClosedProjection';

export function useRequestProjection() {
  const [requests, setRequests] = useState(() => [
    ...getRaisedRequests(),
    ...getClosedRequests()
  ]);

  useEffect(() => {
    const update = () => {
      setRequests([...getRaisedRequests(), ...getClosedRequests()]);
    };

    // Subscribe to both raised and closed updates
    const unsubscribes = [
      subscribeRaisedRequests(update),
      subscribeClosedRequests(update),
    ];

    // Clean up subscriptions on unmount
    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  return { requests };
}

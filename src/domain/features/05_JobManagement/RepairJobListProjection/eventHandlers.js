// jobEventHandlers.js
import { eventBus } from '@core/eventBus';
import { RepairJobProjection } from './rebuildProjection';

export function subscribeJobEvents() {
  const handleEvent = (event) => RepairJobProjection.handleEvent(event);

  const unsubscribers = [
    eventBus.subscribe('JobCreated', handleEvent),
    eventBus.subscribe('JobStarted', handleEvent),
    eventBus.subscribe('JobCompleted', handleEvent),
    eventBus.subscribe('JobOnHold', handleEvent),
    eventBus.subscribe('ChangeRequestReceivedPendingAssessment', handleEvent)
  ];

  return () => unsubscribers.forEach(unsub => unsub());
}

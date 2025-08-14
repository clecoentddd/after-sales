// src/domain/features/05_JobManagement/92_JobChangeRequestManager/initializeCreatedJobChangeRequestProcessManager.js
import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore';

let isInitialized = false;

console.log('[DEBUG] EventBus instance ID', eventBus);

eventBus.subscribe('*', (event) => {
  console.log('[DEBUG] CATCH-ALL saw event:', event);
});

export const initializeCreatedJobChangeRequestProcessManager = () => {
  if (isInitialized) {
    console.log('[JobChangeRequestProcessManager] Already initialized. Skipping.');
    return;
  }

  console.log('[DEBUG] EventBus in subscriber module:', eventBus);
  
 eventBus.subscribe('ChangeRequestJobAssigned', (event) => {
  console.log('[JobChangeRequestProcessManager] Received ChangeRequestJobAssigned:');
  console.log('  aggregateId:', event.aggregateId);
  console.log('  aggregateType:', event.aggregateType);
  console.log('  type:', event.type);
  console.log('  data:', event.data);
  console.log('  timestamp:', event.timestamp);

  const allEvents = jobEventStore.getEvents();
  console.log(' JobChangeRequestProcessManager all events', allEvents);

  // Find all ChangeRequestJobAssigned events
  const allAssignments = allEvents.filter(e => e.type === 'ChangeRequestJobAssigned');

  // Filter to only those without a matching JobOnHold
  const assignmentsWithoutHold = allAssignments.filter(assignEvent => {
    return !allEvents.some(e =>
      e.type === 'JobOnHold' &&
      e.aggregateId === assignEvent.aggregateId &&
      e.changeRequestId === assignEvent.data.changeRequestId
    );
  });

  console.log(`[JobChangeRequestProcessManager] Found ${assignmentsWithoutHold.length} assignments without hold`);

  // Process each one
  assignmentsWithoutHold.forEach(assignEvent => {
    console.log(`[JobChangeRequestProcessManager] Processing job ${assignEvent.aggregateId}`);

    const jobOnHoldEvent = {
      type: 'JobOnHold',
      aggregateId: assignEvent.aggregateId,
      changeRequestId: assignEvent.data.changeRequestId,
      requestId: assignEvent.data.requestId,
      data: {
        putOnHoldBy: 'system',
        reason: 'Change request assigned',
        onHoldAt: new Date().toISOString(),
        status: 'OnHold'
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    };

    jobEventStore.append(jobOnHoldEvent);
    eventBus.publish(jobOnHoldEvent);
    console.log(`[JobChangeRequestProcessManager] Published JobOnHold for job ${assignEvent.aggregateId}`);
  });
});

  isInitialized = true;
  console.log('[JobChangeRequestProcessManager] Subscribed to ChangeRequestJobAssigned.');
};

// src/domain/features/05_JobManagement/92_JobChangeRequestManager/initializeCreatedJobChangeRequestProcessManager.js
import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore';
import { PutJobOnHoldCommand } from '../0511_PutJobOnHold/commands';
import { JobAggregate } from '@entities/Job/aggregate';

let isInitialized = false;

export const initializeCreatedJobChangeRequestProcessManager = () => {
  if (isInitialized) {
    console.log('[JobChangeRequestProcessManager] Already initialized. Skipping.');
    return;
  }

  eventBus.subscribe('ChangeRequestJobAssigned', (event) => {
    console.log('[JobChangeRequestProcessManager] Received ChangeRequestJobAssigned event:', event.aggregateId);

    const allEvents = jobEventStore.getEvents();
    console.log('[JobChangeRequestProcessManager] Total events in store:', allEvents.length);

    // Step 1: Candidate job — Pending (not started or completed)
    const jobCreatedEvent = allEvents.find(e =>
      e.aggregateId === event.aggregateId && e.type === 'JobCreated'
    );
    const jobStartedEvent = allEvents.find(e =>
      e.aggregateId === event.aggregateId && e.type === 'JobStarted'
    );
    const jobCompletedEvent = allEvents.find(e =>
      e.aggregateId === event.aggregateId && e.type === 'JobCompleted'
    );

    if (!jobCreatedEvent || jobStartedEvent || jobCompletedEvent) {
      console.log(`[JobChangeRequestProcessManager] Job ${event.aggregateId} is either not pending, already started, or completed. Skipping.`);
      return;
    }

    // Step 2: Rebuild the aggregate state to check latest CRstatus
    const aggregate = new JobAggregate();
    const jobEvents = allEvents
      .filter(e => e.aggregateId === event.aggregateId)
      .sort((a, b) => new Date(a.metadata?.timestamp || a.timestamp) - new Date(b.metadata?.timestamp || b.timestamp));

    jobEvents.forEach(e => aggregate.apply(e));
    console.log('[JobChangeRequestProcessManager] Replayed events for aggregate:', jobEvents.length);

    // Step 3: Check latest CRstatus
    if (aggregate.CRstatus) {
      console.warn(`[JobChangeRequestProcessManager] Job ${event.aggregateId} already has CRstatus "${aggregate.CRstatus}". Skipping.`);
      return;
    }

    try {
      // Step 4: Create command and put job on hold
      const command = PutJobOnHoldCommand(
        event.aggregateId,
        'system',
        'Change request assigned',
        event.data.changeRequestId
      );

      console.log('[JobChangeRequestProcessManager] Creating PutJobOnHoldCommand:', command);

      const onHoldEvent = aggregate.putOnHold(command);

      if (onHoldEvent) {
        jobEventStore.append(onHoldEvent);
        eventBus.publish(onHoldEvent);
        console.log(`[JobChangeRequestProcessManager] Job ${event.aggregateId} flagged as OnHold.`);
      }
    } catch (error) {
      console.error('[JobChangeRequestProcessManager] Error putting job on hold:', error);
    }
  });

  isInitialized = true;
  console.log('[JobChangeRequestProcessManager] Initialized.');
};

// src/domain/features/05_JobManagement/92_JobChangeRequestManager/initializeCreatedJobChangeRequestProcessManager.js
import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore';
import { PutJobOnHoldCommand } from '../0511_PutJobOnHold/commands';
import { OnHoldJobCommandHandler } from '../0511_PutJobOnHold/commandHandler';

let isInitialized = false;

export const initializeCreatedJobChangeRequestProcessManager = () => {
  if (isInitialized) {
    console.log('[JobChangeRequestProcessManager] Already initialized. Skipping.');
    return;
  }

  eventBus.subscribe('ChangeRequestJobAssigned', (event) => {
    console.log('[JobChangeRequestProcessManager] Received ChangeRequestJobAssigned:', event);

    const allEvents = jobEventStore.getEvents();

    // Find all assignments without a JobOnHold
    const assignmentsWithoutHold = allEvents
      .filter(e => e.type === 'ChangeRequestJobAssigned')
      .filter(assignEvent =>
        !allEvents.some(e =>
          e.type === 'JobOnHold' &&
          e.aggregateId === assignEvent.aggregateId &&
          e.changeRequestId === assignEvent.data.changeRequestId
        )
      );

    console.log(`[JobChangeRequestProcessManager] Found ${assignmentsWithoutHold.length} assignments without hold`);

    assignmentsWithoutHold.forEach(assignEvent => {
      console.log(`[JobChangeRequestProcessManager] Issuing PutJobOnHoldCommand for job ${assignEvent.aggregateId}`);

      const command = PutJobOnHoldCommand(
        assignEvent.aggregateId,
        'system',
        'Change request assigned',
        assignEvent.data.changeRequestId
      );

      OnHoldJobCommandHandler.handle(command);
    });
  });

  isInitialized = true;
  console.log('[JobChangeRequestProcessManager] Subscribed to ChangeRequestJobAssigned.');
};

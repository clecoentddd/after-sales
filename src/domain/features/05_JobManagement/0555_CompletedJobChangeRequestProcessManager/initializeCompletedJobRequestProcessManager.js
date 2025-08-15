// src/domain/features/05_JobManagement/92_JobChangeRequestManager/initializeCompletedJobChangeRequestProcessManager.js
import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore';
import { RejectChangeRequestForCompletedJobCommand } from '../0513_RejectChangeRequestForCompletedJob/commands';
import { RejectChangeRequestForCompletedJobCommandHandler } from '../0513_RejectChangeRequestForCompletedJob/commandHandler';

let isInitialized = false;

export const initializeCompletedJobChangeRequestProcessManager = () => {
  if (isInitialized) {
    console.log('[CompletedJobChangeRequestManager] Already initialized. Skipping.');
    return;
  }

  eventBus.subscribe('ChangeRequestJobAssigned', (event) => {
    console.log('[CompletedJobChangeRequestManager] Received ChangeRequestJobAssigned:', event.aggregateId);

    const allEvents = jobEventStore.getEvents();

    // Step 1: Check if job is completed
    const jobCompletedEvent = allEvents.find(e =>
      e.aggregateId === event.aggregateId && e.type === 'JobCompleted'
    );

    if (!jobCompletedEvent) {
      console.log(`[CompletedJobChangeRequestManager] Job ${event.aggregateId} is not completed. Skipping rejection.`);
      return;
    }

    try {
      // Step 2: Reject the change request
      const command = RejectChangeRequestForCompletedJobCommand(
        event.aggregateId,
        event.data.changeRequestId,
        'system',
        'Cannot accept change request for a completed job'
      );

      console.log('[CompletedJobChangeRequestManager] Creating RejectChangeRequestForCompletedJobCommand:', command);

      RejectChangeRequestForCompletedJobCommandHandler.handle(command);
      console.log(`[CompletedJobChangeRequestManager] Change request ${event.data.changeRequestId} rejected for completed job ${event.aggregateId}.`);
    } catch (error) {
      console.error('[CompletedJobChangeRequestManager] Error rejecting change request:', error);
    }
  });

  isInitialized = true;
  console.log('[CompletedJobChangeRequestManager] Initialized.');
};

// src/domain/features/05_JobManagement/92_JobChangeRequestManager/initializeCreatedJobChangeRequestProcessManager.js
import { eventBus } from '@core/eventBus';
import { JobCreatedProjection } from '../0502_JobCreatedProjection/JobCreatedProjection';
import { PutJobOnHoldCommand } from '../0511_PutJobOnHold/commands';
import { OnHoldJobCommandHandler } from '../0511_PutJobOnHold/commandHandler';

let isInitialized = false;

export const initializeCreatedJobChangeRequestProcessManager = () => {
  if (isInitialized) {
    console.log('[ProcessManager] Already initialized. Skipping.');
    return;
  }

  eventBus.subscribe('ChangeRequestJobAssigned', async (event) => {
    console.log('[ProcessManager] Received ChangeRequestJobAssigned event:', event.aggregateId);

    const requestId = event.data.requestId;
    if (!requestId) {
      console.warn('[ProcessManager] Event missing requestId, skipping.');
      return;
    }

    // Query projection for the jobId
    const jobId = JobCreatedProjection.queryCreatedJobsList(requestId);

    if (!jobId) {
      console.warn(`[ProcessManager] No job found for requestId ${requestId}. Skipping.`);
      return;
    }

    // Build the command
    const command = PutJobOnHoldCommand(
      jobId,
      'system',
      'Change request assigned',
      event.data.changeRequestId
    );

    // Send command to aggregate via command handler
    const result = OnHoldJobCommandHandler.handle(command);

    if (!result.success) {
      console.error(`[ProcessManager] Failed to put job ${jobId} on hold:`, result.error);
    } else {
      console.log(`[ProcessManager] Job ${jobId} successfully processed for change request.`);
    }
  });

  isInitialized = true;
  console.log('[ProcessManager] Initialized.');
};

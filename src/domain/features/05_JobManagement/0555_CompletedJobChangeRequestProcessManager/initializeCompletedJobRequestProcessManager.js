// src/domain/features/05_JobManagement/92_JobChangeRequestManager/initializeCompletedJobChangeRequestProcessManager.js
import { eventBus } from '@core/eventBus';
import { JobCompletedProjection } from '../0506_CompletedJobProjection/JobCompletedProjection';
import { RejectChangeRequestForCompletedJobCommand } from '../0513_RejectChangeRequest/commands';
import { RejectChangeRequestForCompletedJobCommandHandler } from '../0513_RejectChangeRequest/commandHandler';

let isInitialized = false;

export const initializeCompletedJobChangeRequestProcessManager = () => {
  if (isInitialized) {
    console.log('[CompletedJobChangeRequestManager] Already initialized. Skipping.');
    return;
  }

  eventBus.subscribe('ChangeRequestJobAssigned', (event) => {
    console.log('[CompletedJobChangeRequestManager] Received ChangeRequestJobAssigned:', event.aggregateId);

    const requestId = event.data?.requestId;
    const changeRequestId = event.data?.changeRequestId;

    if (!requestId || !changeRequestId) {
      console.warn('[CompletedJobChangeRequestManager] Event missing requestId or changeRequestId. Skipping.');
      return;
    }

    // Step 1: Query projection to get jobId for the requestId
    const jobId = JobCompletedProjection.queryCompletedJobsList(requestId);

    if (!jobId) {
      console.log(`[CompletedJobChangeRequestManager] No completed job found for requestId ${requestId}. Skipping rejection.`);
      return;
    }

    try {
      // Step 2: Reject the change request
      const command = RejectChangeRequestForCompletedJobCommand(
        jobId,
        requestId,
        changeRequestId
      );

      console.log('[CompletedJobChangeRequestManager] Created RejectChangeRequestForCompletedJobCommand:', command);

      const result = RejectChangeRequestForCompletedJobCommandHandler.handle(command);

      if (!result.success) {
        console.error(`[CompletedJobChangeRequestManager] Failed to reject change request ${changeRequestId} for completed job ${jobId}:`, result.error);
      } else {
        console.log(`[CompletedJobChangeRequestManager] Change request ${changeRequestId} rejected for completed job ${jobId}.`);
      }
    } catch (error) {
      console.error('[CompletedJobChangeRequestManager] Error rejecting change request:', error);
    }
  });

  isInitialized = true;
  console.log('[CompletedJobChangeRequestManager] Initialized.');
};

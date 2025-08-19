// src/domain/features/05_JobManagement/92_JobChangeRequestManager/initializeStartedJobChangeRequestProcessManager.js
import { eventBus } from '@core/eventBus';
import { JobStartedProjection } from '../0504_StartedJobProjection/JobStartedProjection';
import { FlagJobForAssessmentCommand } from '../0512_AssessChangeRequest/commands';
import { FlagJobForAssessmentCommandHandler } from '../0512_AssessChangeRequest/commandHandler';

let isInitialized = false;

export const initializeStartedJobChangeRequestProcessManager = () => {
  if (isInitialized) {
    console.log('[initializeStartedJobChangeRequestProcessManager] Already initialized. Skipping.');
    return;
  }

  eventBus.subscribe('ChangeRequestJobAssigned', async (event) => {
    console.log('[initializeStartedJobChangeRequestProcessManager] Received ChangeRequestJobAssigned event:', event.aggregateId);

    const requestId = event.data.requestId;
    if (!requestId) {
      console.warn('[initializeStartedJobChangeRequestProcessManager] Event missing requestId, skipping.');
      return;
    }

    // Query projection for the jobId using the requestId
    const jobId = JobStartedProjection.queryStartedJobsList(requestId);

    if (!jobId) {
      console.warn(`[initializeStartedJobChangeRequestProcessManager] No started job found for requestId ${requestId}. Skipping.`);
      return;
    }

    // Build the command to flag job for assessment
    const command = FlagJobForAssessmentCommand(
      jobId,
      requestId,
      event.data.changeRequestId,
      'system',
      'Started Jobs require an assesment'
    );

    // Send command to aggregate via command handler
    const result = FlagJobForAssessmentCommandHandler.handle(command);

    if (!result.success) {
      console.error(`[initializeStartedJobChangeRequestProcessManager] Failed to flag job ${jobId} for assessment:`, result.error);
    } else {
      console.log(`[initializeStartedJobChangeRequestProcessManager] Job ${jobId} successfully flagged for assessment.`);
    }
  });

  isInitialized = true;
  console.log('[initializeStartedJobChangeRequestProcessManager] Initialized.');
};

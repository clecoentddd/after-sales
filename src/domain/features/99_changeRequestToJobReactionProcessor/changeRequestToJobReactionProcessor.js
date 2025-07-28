// src/domain/automation/changeRequestToJobReactionProcessor.js

import { eventBus } from '../../core/eventBus';
import { jobEventStore } from '../../core/eventStore';

import { onHoldJobCommandHandler } from '../23_PutJobOnHold/commandHandler';
import { PutJobOnHoldCommand } from '../23_PutJobOnHold/commands';

// TODO: Stubbed for now
import { flagJobForAssessmentCommandHandler } from '../29_JobChangeRequestAssessment/commandHandler';
import { FlagJobForAssessmentCommand } from '../29_JobChangeRequestAssessment/commands';

import { rejectChangeRequestCommandHandler } from '../31_RejectJobOnChangeRequest/commandHandler';
import { RejectChangeRequestCommand } from '../31_RejectJobOnChangeRequest/commands';

let isProcessorInitialized = false;

const reconstructJobState = (jobId) => {
  const allEvents = jobEventStore.getEvents().sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let job = null;

  allEvents.forEach(event => {
    if (event.data.jobId === jobId) {
      switch (event.type) {
        case 'JobCreated':
          job = { ...event.data, status: 'Pending' };
          break;
        case 'JobStarted':
          job.status = 'Started';
          break;
        case 'JobCompleted':
          job.status = 'Completed';
          break;
        case 'JobOnHold':
          job.status = 'OnHold';
          job.onHoldReason = event.data.reason;
          break;
      }
    }
  });

  return job;
};

export const initializeChangeRequestToJobReactionProcessor = () => {
  if (isProcessorInitialized) return;

  eventBus.subscribe('ChangeRequestRaised', (event) => {
    const { requestId, changeRequestId, changedByUserId, description } = event.data;

    const jobEvents = jobEventStore.getEvents()
      .filter(e => e.type === 'JobCreated' && e.data.requestId === requestId);

    if (jobEvents.length === 0) {
      console.warn(`[Processor] No job found for request ${requestId}. Rejecting change request.`);
      rejectChangeRequestCommandHandler.handle(
        RejectChangeRequestCommand(changeRequestId, changedByUserId, 'No job found for request.')
      );
      return;
    }

    jobEvents.forEach(jobCreated => {
      const jobId = jobCreated.data?.jobId || jobCreated.jobId;
      const job = reconstructJobState(jobId);

      if (!job) {
        console.warn(`[Processor] Job ${jobId} not found in state. Rejecting.`);
        rejectChangeRequestCommandHandler.handle(
          RejectChangeRequestCommand(changeRequestId, changedByUserId, 'Job not found.')
        );
        return;
      }

      switch (job.status) {
        case 'Pending':
          onHoldJobCommandHandler.handle(
            PutJobOnHoldCommand(
              jobId,
              changedByUserId,
              `Change request raised: ${description}`,
              changeRequestId
            )
          );
          break;

        case 'Started':
          flagJobForAssessmentCommandHandler.handle(
            FlagJobForAssessmentCommand(
              jobId,
              changeRequestId,
              changedByUserId,
              `Change request needs assessment: ${description}`
            )
          );
          break;

        case 'Completed':
          rejectChangeRequestCommandHandler.handle(
            RejectChangeRequestCommand(
              changeRequestId,
              changedByUserId,
              'Job already completed. Cannot apply change request.'
            )
          );
          break;

        default:
          console.warn(`[Processor] Unknown or unsupported job status for ${jobId}: ${job.status}`);
          rejectChangeRequestCommandHandler.handle(
            RejectChangeRequestCommand(changeRequestId, changedByUserId, 'Unsupported job status.')
          );
      }
    });
  });

  isProcessorInitialized = true;
  console.log('[AutomationProcessor] Subscribed to ChangeRequestRaised for job reactions.');
};

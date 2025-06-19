// src/domain/features/changeRequested/eventHandler.js
// This handler subscribes to the 'ChangeRequestRaised' event.
// If an associated job is pending, it dispatches a 'PutJobOnHold' command.

import { eventBus } from '../../core/eventBus';
import { jobCreationEventStore, startJobEventStore, jobCompletionEventStore, onHoldJobEventStore } from '../../core/eventStore';
import { onHoldJobCommandHandler } from '../onHoldJob/commandHandler';
import { PutJobOnHoldCommand } from '../onHoldJob/commands';

let isChangeRequestEventHandlerInitialized = false;

/**
 * Reconstructs the current state of a single job from its events.
 * This is a helper function to get the latest status and details of a job.
 * In a more complex application, this would typically come from a dedicated read model.
 * @param {string} jobId - The ID of the job to reconstruct.
 * @returns {object|null} The reconstructed job object or null if not found.
 */
const reconstructJobState = (jobId) => {
  const allJobEvents = [
    ...jobCreationEventStore.getEvents(),
    ...startJobEventStore.getEvents(),
    ...jobCompletionEventStore.getEvents(),
    ...onHoldJobEventStore.getEvents()
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let job = null;

  allJobEvents.forEach(event => {
    if (event.data.jobId === jobId) {
      if (event.type === 'JobCreated') {
        job = { ...event.data };
      } else if (job && event.type === 'JobStarted') {
        job.status = 'Started';
        job.jobDetails = { ...job.jobDetails, assignedTeam: event.data.assignedTeam };
      } else if (job && event.type === 'JobCompleted') {
        job.status = 'Completed';
        job.completionDetails = event.data.completionDetails;
      } else if (job && event.type === 'JobOnHold') {
        job.status = 'On Hold';
        job.onHoldReason = event.data.reason;
      }
    }
  });
  return job;
};

/**
 * Initializes the change request event handler by subscribing to 'ChangeRequestRaised' events.
 * This function is designed to be idempotent.
 */
export const initializeChangeRequestEventHandler = () => {
  if (isChangeRequestEventHandlerInitialized) {
    console.warn('[ChangeRequestEventHandler] Already initialized. Skipping re-subscription.');
    return;
  }

  eventBus.subscribe('ChangeRequestRaised', (event) => {
    console.log(`[ChangeRequestEventHandler] Received ChangeRequestRaised event:`, event);

    const { requestId, changedByUserId, description } = event.data;

    // Find all jobs related to this requestId
    const allJobCreatedEvents = jobCreationEventStore.getEvents()
      .filter(e => e.type === 'JobCreated' && e.data.requestId === requestId)
      .map(e => e.data);

    allJobCreatedEvents.forEach(jobCreated => {
      const jobId = jobCreated.jobId;
      const currentJobState = reconstructJobState(jobId);

      if (currentJobState && currentJobState.status === 'Pending') {
        console.log(`[ChangeRequestEventHandler] Job ${jobId} is Pending and related to Change Request. Putting on Hold.`);
        onHoldJobCommandHandler.handle(
          PutJobOnHoldCommand(
            jobId,
            changedByUserId, // User who raised the change request is putting job on hold
            `Change request raised: ${description}`
          )
        );
      } else {
        console.log(`[ChangeRequestEventHandler] Job ${jobId} not found or not in 'Pending' status. Current status: ${currentJobState?.status || 'Not Found'}. Skipping hold.`);
      }
    });
  });

  isChangeRequestEventHandlerInitialized = true;
  console.log('[ChangeRequestEventHandler] Subscribed to ChangeRequestRaised events for job holding.');
};

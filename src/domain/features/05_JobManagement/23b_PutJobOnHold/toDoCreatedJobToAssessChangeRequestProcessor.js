import { eventBus } from '@core/eventBus';
import { OnHoldJobCommandHandler } from './commandHandler';
import { PutJobOnHoldCommand } from './commands';
import { reconstructJobState } from '@entities/Job/repository';

let isCreatedJobProcessorInitialized = false;

export const initializeToDoCreatedJobToAssessChangeRequest = () => {
  console.log('[initializeToDoCreatedJobToAssessChangeRequest] Initializing Created Job Processor');

  if (isCreatedJobProcessorInitialized) return;

  // Handle job assignment to change request
  const handleChangeRequestJobAssigned = (event) => {
    console.log('[initializeToDoCreatedJobToAssessChangeRequest] Received changeRequestJobAssignedEvent for:', event.changeRequestId);

    // Find the job associated with this change request
    const job = reconstructJobState(event.jobId);

    if (!job) {
      console.warn(`[initializeToDoCreatedJobToAssessChangeRequest] Job ${event.jobId} not found in state. Ignoring.`);
      return;
    }

    // Only process jobs with 'Pending' status (Created jobs)
    if (job.status === 'Pending') {
      console.log(`[initializeToDoCreatedJobToAssessChangeRequest] Processing pending job ${event.jobId} - putting on hold for change request ${event.changeRequestId}`);

      // Put the job on hold
      OnHoldJobCommandHandler.handle(
        new PutJobOnHoldCommand(
          event.jobId,
          event.changedByUserId,
          `Change request raised: ${event.description || 'No description provided'}`,
          event.changeRequestId
        )
      );
    } else {
      console.log(`[initializeToDoCreatedJobToAssessChangeRequest] Job ${event.jobId} is not in Pending state. Current status: ${job.status}. Ignoring.`);
    }
  };

  // Subscribe to job assignment events
  eventBus.subscribe('ChangeRequestJobAssigned', handleChangeRequestJobAssigned);

  isCreatedJobProcessorInitialized = true;
  console.log('[initializeToDoCreatedJobToAssessChangeRequest] Initialized and ready to process changeRequestJobAssigned events.');
};

// src/domain/features/99_changeRequestToJobReactionProcessor/initializeAssignCompleteJobToChangeRequestProcessor.js

import { eventBus } from '../../core/eventBus';
import { jobEventStore } from '../../core/eventStore';
import { requestEventStore } from '../../core/eventStore';
import { RejectChangeRequestAssignmentCommandHandler } from './commandHandler';
import { RejectChangeRequestAssignmentCommand } from './commands';
import { AssignCompleteJobToChangeRequestCommandHandler } from './assignCompleteJobToChangeRequestCommandHandler';
import { AssignCompleteJobToChangeRequestCommand } from './assignCompleteJobToChangeRequestCommand';
import { CompleteJobAssignedToChangeRequestEvent } from './CompleteJobAssignedToChangeRequestEvent';
import { TODO_STATUS, todoList, updateTodoList } from './todoListManager';
import { reconstructJobState } from '../../entities/Job/aggregate';

const isEventProcessed = (eventId) => {
  const item = todoList.find(item => item.eventId === eventId);
  return item ? item.track === TODO_STATUS.TO_BE_ASSESSED : false;
};

let isCompleteJobProcessorInitialized = false;

export const initializeAssignCompleteJobToChangeRequestProcessor = () => {
  if (isCompleteJobProcessorInitialized) return;

  eventBus.subscribe('ChangeRequestRaised', (event) => {
    console.log('[CompleteJobProcessor] Received ChangeRequestRaised event:', event);
    const eventId = `${event.data.changeRequestId}-${Date.now()}`;

    if (isEventProcessed(eventId)) {
      console.log(`[CompleteJobProcessor] Event ${eventId} already processed. Skipping.`);
      return;
    }

    const { requestId, changeRequestId, changedByUserId, description } = event.data;

    const allJobEvents = jobEventStore.getEvents();
    console.log('[CompleteJobProcessor] All events in jobEventStore:', allJobEvents);

    const jobCreatedEvents = allJobEvents.filter(e => e.type === 'JobCreated');
    console.log('[CompleteJobProcessor] All JobCreated events:', jobCreatedEvents);

    const jobEvents = jobCreatedEvents.filter(e => e.data.requestId === requestId);
    console.log(`[CompleteJobProcessor] JobCreated events for request ${requestId}:`, jobEvents);

    if (jobEvents.length === 0) {
      console.warn(`[CompleteJobProcessor] No job found for request ${requestId}. Rejecting change request.`);
      RejectChangeRequestAssignmentCommandHandler.handle(
        RejectChangeRequestAssignmentCommand(changeRequestId, requestId, changedByUserId, 'No job found for request')
      );
      updateTodoList(eventId, TODO_STATUS.ERROR_NO_JOB, "Unknown Job", changeRequestId, changedByUserId, 'No job found for request');
      return;
    }

    jobEvents.forEach(jobCreated => {
      const jobId = jobCreated.data?.jobId || jobCreated.jobId;
      const job = reconstructJobState(jobId);
      console.log(`[CompleteJobProcessor] Reconstructed job state for ${jobId}:`, job); 

      if (!job) {
        console.warn(`[CompleteJobProcessor] Job ${jobId} not found in state. Rejecting.`);
        RejectChangeRequestAssignmentCommandHandler.handle(
          RejectChangeRequestAssignmentCommand(changeRequestId, requestId, changedByUserId, 'Job not found in state')
        );
        updateTodoList(eventId, TODO_STATUS.ERROR_NO_JOB, "Unknown Job", changeRequestId, changedByUserId, 'Job not found in state');
        return;
      }

      // Only process jobs with "Complete" or "Closed" status
      if (job.status === 'Completed' || job.status === 'Closed') {
        console.log(`[CompleteJobProcessor] Processing complete job ${jobId} for change request ${changeRequestId}`);
        
        updateTodoList(eventId, TODO_STATUS.TO_BE_ASSESSED, jobId, changeRequestId, changedByUserId, description);
        
        // Use specific command for complete jobs
        AssignCompleteJobToChangeRequestCommandHandler.handle(
          AssignCompleteJobToChangeRequestCommand(jobId, changeRequestId, changedByUserId, description)
        );

        const completeJobAssignedEvent = CompleteJobAssignedToChangeRequestEvent(jobId, changeRequestId, changedByUserId, description);
        requestEventStore.append(completeJobAssignedEvent);
        eventBus.publish(completeJobAssignedEvent);
      }
    });
  });

  isCompleteJobProcessorInitialized = true;
  console.log('[CompleteJobProcessor] Subscribed to ChangeRequestRaised for complete job matching.');
};

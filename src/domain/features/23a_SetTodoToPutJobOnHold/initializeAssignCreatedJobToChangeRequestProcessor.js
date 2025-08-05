// src/domain/features/99_changeRequestToJobReactionProcessor/initializeAssignCreatedJobToChangeRequestProcessor.js

import { eventBus } from '../../core/eventBus';
import { jobEventStore } from '../../core/eventStore';
import { requestEventStore } from '../../core/eventStore';
import { RejectChangeRequestAssignmentCommandHandler } from '../99_ToDoChangeRequestProcessManager/commandHandler';
import { RejectChangeRequestAssignmentCommand } from '../99_ToDoChangeRequestProcessManager/commands';
import { AssignCreatedJobToChangeRequestCommandHandler } from './assignCreatedJobToChangeRequestCommandHandler';
import { AssignCreatedJobToChangeRequestCommand } from './assignCreatedJobToChangeRequestCommand';
import { CreatedJobAssignedToChangeRequestEvent } from '../../events/CreatedJobAssignedToChangeRequestEvent';
import { TODO_STATUS, todoList, updateTodoList } from '../99_ToDoChangeRequestProcessManager/todoListManager';
import { reconstructJobState } from '../../entities/Job/aggregate';

const isEventProcessed = (eventId) => {
  const item = todoList.find(item => item.eventId === eventId);
  return item ? item.track === TODO_STATUS.TO_BE_ASSESSED : false;
};

let isCreatedJobProcessorInitialized = false;

export const initializeAssignCreatedJobToChangeRequestProcessor = () => {
  console.log('[initializeAssignCreatedJobToChangeRequestProcessor] Initializing Created Job Processor');
  if (isCreatedJobProcessorInitialized) return;

  eventBus.subscribe('ChangeRequestRaised', (event) => {
    console.log('[CreatedJobProcessor] Received ChangeRequestRaised event:', event);
    const eventId = `${event.data.changeRequestId}-${Date.now()}`;

    if (isEventProcessed(eventId)) {
      console.log(`[CreatedJobProcessor] Event ${eventId} already processed. Skipping.`);
      return;
    }

    const { requestId, changeRequestId, changedByUserId, description } = event.data;

    const allJobEvents = jobEventStore.getEvents();
    console.log('[CreatedJobProcessor] All events in jobEventStore:', allJobEvents);

    const jobCreatedEvents = allJobEvents.filter(e => e.type === 'JobCreated');
    console.log('[CreatedJobProcessor] All JobCreated events:', jobCreatedEvents);

    const jobEvents = jobCreatedEvents.filter(e => e.data.requestId === requestId);
    console.log(`[CreatedJobProcessor] JobCreated events for request ${requestId}:`, jobEvents);

    if (jobEvents.length === 0) {
      console.warn(`[CreatedJobProcessor] No job found for request ${requestId}. Rejecting change request.`);
      RejectChangeRequestAssignmentCommandHandler.handle(
        RejectChangeRequestAssignmentCommand(changeRequestId, requestId, changedByUserId, 'No job found for request')
      );
      updateTodoList(eventId, TODO_STATUS.ERROR_NO_JOB, "Unknown Job", changeRequestId, changedByUserId, 'No job found for request');
      return;
    }

    jobEvents.forEach(jobCreated => {
      const jobId = jobCreated.data?.jobId || jobCreated.jobId;
      const job = reconstructJobState(jobId);
      console.log(`[CreatedJobProcessor] Reconstructed job state for ${jobId}:`, job);

      if (!job) {
        console.warn(`[CreatedJobProcessor] Job ${jobId} not found in state. Rejecting.`);
        RejectChangeRequestAssignmentCommandHandler.handle(
          RejectChangeRequestAssignmentCommand(changeRequestId, requestId, changedByUserId, 'Job not found in state')
        );
        updateTodoList(eventId, TODO_STATUS.ERROR_NO_JOB, "Unknown Job", changeRequestId, changedByUserId, 'Job not found in state');
        return;
      }

      // Only process jobs with "Created" status
      if (job.status === 'Pending') {
        console.log(`[CreatedJobProcessor] Processing created job ${jobId} for change request ${changeRequestId}`);
        
        updateTodoList(eventId, TODO_STATUS.TO_BE_ASSESSED, jobId, changeRequestId, changedByUserId, description);
        
        // Use specific command for created jobs
        AssignCreatedJobToChangeRequestCommandHandler.handle(
          AssignCreatedJobToChangeRequestCommand(jobId, changeRequestId, changedByUserId, description)
        );

        const CreatedJobAssignedToChangeRequest = CreatedJobAssignedToChangeRequestEvent(jobId, changeRequestId, changedByUserId, description);
        console.log(`[CreatedJobProcessor] Appending Created job assigned event:`, CreatedJobAssignedToChangeRequest);
        requestEventStore.append(CreatedJobAssignedToChangeRequest);
        console.log(`[CreatedJobProcessor] Publishing Created job assigned event:`, CreatedJobAssignedToChangeRequest);
        eventBus.publish(CreatedJobAssignedToChangeRequest);
      }
    });
  });

  isCreatedJobProcessorInitialized = true;
  console.log('[CreatedJobProcessor] Subscribed to ChangeRequestRaised for created job matching.');
};

// src/domain/features/99_changeRequestToJobReactionProcessor/initializeAssignStartedJobToChangeRequestProcessor.js

import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore';
import { requestEventStore } from '@core/eventStore';
import { RejectChangeRequestAssignmentCommandHandler } from '../99_ToDoChangeRequestProcessManager/commandHandler';
import { RejectChangeRequestAssignmentCommand } from '../99_ToDoChangeRequestProcessManager/commands';
import { AssignStartedJobToChangeRequestCommandHandler } from './assignStartedJobToChangeRequestCommandHandler';
import { AssignStartedJobToChangeRequestCommand } from './assignStartedJobToChangeRequestCommand';
import { StartedJobAssignedToChangeRequestEvent } from '@events/StartedJobAssignedToChangeRequestEvent';
import { TODO_STATUS, todoList, updateTodoList } from '../99_ToDoChangeRequestProcessManager/todoListManager';
import { reconstructJobState } from '@entities/Job/aggregate';

const isEventProcessed = (eventId) => {
  const item = todoList.find(item => item.eventId === eventId);
  return item ? item.track === TODO_STATUS.TO_BE_ASSESSED : false;
};

let isStartedJobProcessorInitialized = false;

export const initializeAssignStartedJobToChangeRequestProcessor = () => {
  if (isStartedJobProcessorInitialized) return;

  eventBus.subscribe('ChangeRequestRaised', (event) => {
    console.log('[StartedJobProcessor] Received ChangeRequestRaised event:', event);
    const eventId = `${event.data.changeRequestId}-${Date.now()}`;

    if (isEventProcessed(eventId)) {
      console.log(`[StartedJobProcessor] Event ${eventId} already processed. Skipping.`);
      return;
    }

    const { requestId, changeRequestId, changedByUserId, description } = event.data;

    const allJobEvents = jobEventStore.getEvents();
    console.log('[StartedJobProcessor] All events in jobEventStore:', allJobEvents);

    const jobCreatedEvents = allJobEvents.filter(e => e.type === 'JobCreated');
    console.log('[StartedJobProcessor] All JobCreated events:', jobCreatedEvents);

    const jobEvents = jobCreatedEvents.filter(e => e.data.requestId === requestId);
    console.log(`[StartedJobProcessor] JobCreated events for request ${requestId}:`, jobEvents);

    if (jobEvents.length === 0) {
      console.warn(`[StartedJobProcessor] No job found for request ${requestId}. Rejecting change request.`);
      RejectChangeRequestAssignmentCommandHandler.handle(
        RejectChangeRequestAssignmentCommand(changeRequestId, requestId, changedByUserId, 'No job found for request')
      );
      updateTodoList(eventId, TODO_STATUS.ERROR_NO_JOB, "Unknown Job", changeRequestId, changedByUserId, 'No job found for request');
      return;
    }

    jobEvents.forEach(jobCreated => {
      const jobId = jobCreated.data?.jobId || jobCreated.jobId;
      const job = reconstructJobState(jobId);

      if (!job) {
        console.warn(`[StartedJobProcessor] Job ${jobId} not found in state. Rejecting.`);
        RejectChangeRequestAssignmentCommandHandler.handle(
          RejectChangeRequestAssignmentCommand(changeRequestId, requestId, changedByUserId, 'Job not found in state')
        );
        updateTodoList(eventId, TODO_STATUS.ERROR_NO_JOB, "Unknown Job", changeRequestId, changedByUserId, 'Job not found in state');
        return;
      }

      // Only process jobs with "Started" status
      if (job.status === 'Started') {
        console.log(`[StartedJobProcessor] Processing started job ${jobId} for change request ${changeRequestId}`);
        
        updateTodoList(eventId, TODO_STATUS.TO_BE_ASSESSED, jobId, changeRequestId, changedByUserId, description);
        
        // Use specific command for started jobs
        AssignStartedJobToChangeRequestCommandHandler.handle(
          AssignStartedJobToChangeRequestCommand(jobId, changeRequestId, changedByUserId, description)
        );

        const startedJobAssignedEvent = StartedJobAssignedToChangeRequestEvent(jobId, changeRequestId, changedByUserId, description);
        requestEventStore.append(startedJobAssignedEvent);
        eventBus.publish(startedJobAssignedEvent);
      }
    });
  });

  isStartedJobProcessorInitialized = true;
  console.log('[StartedJobProcessor] Subscribed to ChangeRequestRaised for started job matching.');
};
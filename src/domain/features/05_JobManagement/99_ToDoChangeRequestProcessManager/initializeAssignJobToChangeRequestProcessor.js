// src/domain/automation/assignJobToChangeRequestProcessor.js

import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore';
import { requestEventStore } from '@core/eventStore';
import { RejectChangeRequestAssignmentCommandHandler } from './commandHandler';
import { RejectChangeRequestAssignmentCommand } from './commands';
import { JobAssignedToChangeRequestEvent } from '@events/JobAssignedToChangeRequestEvent';
import { TODO_STATUS, todoList, updateTodoList } from './todoListManager';
import { reconstructJobState } from '@entities/Job/repository'; // Adjust the import path as needed

const isEventProcessed = (eventId) => {
  const item = todoList.find(item => item.eventId === eventId);
  return item ? item.track === TODO_STATUS.TO_BE_ASSESSED : false;
};

// Initialize the processor to handle job assignments to change requests

let isMatchingProcessorInitialized = false;

export const initializeAssignJobToChangeRequestProcessor = () => {
  if (isMatchingProcessorInitialized) return;

  eventBus.subscribe('ChangeRequestRaised', (event) => {
    console.log('[Processor] Received ChangeRequestRaised event:', event);
    const eventId = `${event.data.changeRequestId}-${Date.now()}`;

    if (isEventProcessed(eventId)) {
      console.log(`[Processor] Event ${eventId} already processed. Skipping.`);
      return;
    }

    const { requestId, changeRequestId, changedByUserId, description } = event.data;

    const allJobEvents = jobEventStore.getEvents();
    console.log('[Processor] All events in jobEventStore:', allJobEvents);

    const jobCreatedEvents = allJobEvents.filter(e => e.type === 'JobCreated');
    console.log('[Processor] All JobCreated events:', jobCreatedEvents);

    const jobEvents = jobCreatedEvents.filter(e => e.data.requestId === requestId);
    console.log(`[Processor] JobCreated events for request ${requestId}:`, jobEvents);

    if (jobEvents.length === 0) {
      console.warn(`[Processor] No job found for request ${requestId}. Rejecting change request.`);
      RejectChangeRequestAssignmentCommandHandler.handle(
        RejectChangeRequestAssignmentCommand(changeRequestId, requestId, changedByUserId, 'No job found for request')
      );
      updateTodoList(eventId, TODO_STATUS.ERROR_NO_JOB , "Unknown Job", changeRequestId, changedByUserId, 'No job found for request');
      return;
    }

    jobEvents.forEach(jobCreated => {
      const jobId = jobCreated.data?.jobId || jobCreated.jobId;
      const job = reconstructJobState(jobId);

      if (!job) {
        console.warn(`[initializeAssignJobToChangeRequestProcessor] Job ${jobId} not found in state. Rejecting.`);
        RejectChangeRequestAssignmentCommandHandler.handle(
          RejectChangeRequestAssignmentCommand(changeRequestId, requestId, changedByUserId, 'No job found for request')
        );
           updateTodoList(eventId, TODO_STATUS.ERROR_NO_JOB , "Unknown Job", changeRequestId, changedByUserId, 'No job found for request');
        return;
      }

      updateTodoList(eventId, TODO_STATUS.TO_BE_ASSESSED, jobId, changeRequestId, changedByUserId, description);
      const jobAssignedEvent = JobAssignedToChangeRequestEvent(jobId, changeRequestId, changedByUserId, description);
      requestEventStore.append(jobAssignedEvent);
      eventBus.publish(jobAssignedEvent);

    });
  });

  isMatchingProcessorInitialized = true;
  console.log('[initializeAssignJobToChangeRequestProcessor] Subscribed to ChangeRequestRaised for job matching.');
};

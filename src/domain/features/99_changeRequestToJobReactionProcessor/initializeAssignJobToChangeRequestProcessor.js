// src/domain/automation/assignJobToChangeRequestProcessor.js

import { eventBus } from '../../core/eventBus';
import { jobEventStore } from '../../core/eventStore';
import { requestEventStore } from '../../core/eventStore';
import { RejectChangeRequestAssignmentCommandHandler } from './commandHandler';
import { RejectChangeRequestAssignmentCommand } from './commands';
import { JobAssignedToChangeRequestEvent } from '../../events/JobAssignedToChangeRequestEvent';
import { todoList, updateTodoList } from './todoListManager';

const isEventProcessed = (eventId) => {
  const item = todoList.find(item => item.eventId === eventId);
  return item ? item.track === 'Yes' : false;
};

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
      updateTodoList(eventId, 'Yes');
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
        updateTodoList(eventId, 'Yes');
        return;
      }

      updateTodoList(eventId, 'No', jobId, changeRequestId, changedByUserId, description);
      const jobAssignedEvent = JobAssignedToChangeRequestEvent(jobId, changeRequestId, changedByUserId, description);
      eventBus.publish(jobAssignedEvent);
      requestEventStore.append(jobAssignedEvent);
    });
  });

  isMatchingProcessorInitialized = true;
  console.log('[initializeAssignJobToChangeRequestProcessor] Subscribed to ChangeRequestRaised for job matching.');
};

// src/domain/automation/changeRequestToJobReactionProcessor.js

import { eventBus } from '../../core/eventBus';
import { jobEventStore } from '../../core/eventStore';
import { OnHoldJobCommandHandler } from '../23_PutJobOnHold/commandHandler';
import { PutJobOnHoldCommand } from '../23_PutJobOnHold/commands';
import { FlagJobForAssessmentCommandHandler } from '../29_JobChangeRequestAssessment/commandHandler';
import { FlagJobForAssessmentCommand } from '../29_JobChangeRequestAssessment/commands';
import { RejectChangeRequestCommandHandler } from '../31_RejectJobOnChangeRequest/commandHandler';
import { RejectChangeRequestCommand } from '../31_RejectJobOnChangeRequest/commands';
import { IgnoreChangeRequestCommand } from '../32_IgnoreChangeRequest/commands';
import { RejectChangeRequestAssignmentCommand } from './commands';
import { RejectChangeRequestAssignmentCommandHandler } from './commandHandler';

// Array to simulate the to-do list
let todoList = [];

const updateTodoList = (eventId, status, jobId = null, changeRequestId = null, changedByUserId = null, description = null) => {
  const index = todoList.findIndex(item => item.eventId === eventId);
  if (index !== -1) {
    todoList[index].track = status;
  } else {
    todoList.push({ eventId, track: status, jobId, changeRequestId, changedByUserId, description });
  }
};

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

// Matching Processor
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
  const jobEvents = jobEventStore.getEvents()
    .filter(e => e.type === 'JobCreated' && e.data.requestId === requestId);

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
        console.log(`[initializeAssignJobToChangeRequestProcessor] Publishing event for job not found:`);
        // Create and publish the rejection event
        RejectChangeRequestAssignmentCommandHandler.handle(
          RejectChangeRequestAssignmentCommand(changeRequestId, requestId, changedByUserId, 'No job found for request')
    );
        updateTodoList(eventId, 'Yes');
        return;
      }

      updateTodoList(eventId, 'No', jobId, changeRequestId, changedByUserId, description);
    });
  });

  isMatchingProcessorInitialized = true;
  console.log('[initializeAssignJobToChangeRequestProcessor] Subscribed to ChangeRequestRaised for job matching.');
};

// To-Do List Processor
let isTodoProcessorInitialized = false;

export const initializeChangeRequestToJobTodoProcessor = () => {
  if (isTodoProcessorInitialized) return;

  const processTodoList = () => {
    todoList.forEach(item => {
      if (item.track === 'No') {
        const { jobId, changeRequestId, changedByUserId, description } = item;
        const job = reconstructJobState(jobId);

        if (!job) {
          console.warn(`[TodoProcessor] Job ${jobId} not found in state. Ignoring.`);
          updateTodoList(item.eventId, 'Yes');
          return;
        }

        switch (job.status) {
          case 'Pending':
            OnHoldJobCommandHandler.handle(
              PutJobOnHoldCommand(jobId, changedByUserId, `Change request raised: ${description}`, changeRequestId)
            );
            break;
          case 'Started':
            FlagJobForAssessmentCommandHandler.handle(
              FlagJobForAssessmentCommand(jobId, changeRequestId, changedByUserId, `Change request needs assessment: ${description}`)
            );
            break;
          case 'Completed':
            RejectChangeRequestCommandHandler.handle(
              RejectChangeRequestCommand(changeRequestId, changedByUserId, 'Job already completed. Cannot apply change request.')
            );
            break;
          default:
            console.warn(`[TodoProcessor] Unknown or unsupported job status for ${jobId}: ${job.status}`);
            RejectChangeRequestCommandHandler.handle(
              IgnoreChangeRequestCommand(changeRequestId, changedByUserId, 'Unsupported job status.')
            );
        }

        updateTodoList(item.eventId, 'Yes');
      }
    });
  };

  // Process the todo list periodically or based on some event
  eventBus.subscribe('ProcessTodoList', processTodoList);

  isTodoProcessorInitialized = true;
  console.log('[TodoProcessor] Ready to process todo list.');
};

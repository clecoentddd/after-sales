// src/domain/automation/toDoJobToAssessChangeRequestProcessor.js

import { eventBus } from '../../core/eventBus';
import { jobEventStore } from '../../core/eventStore';
import { OnHoldJobCommandHandler } from '../23_PutJobOnHold/commandHandler';
import { PutJobOnHoldCommand } from '../23_PutJobOnHold/commands';
import { FlagJobForAssessmentCommandHandler } from '../29_JobChangeRequestAssessment/commandHandler';
import { FlagJobForAssessmentCommand } from '../29_JobChangeRequestAssessment/commands';
import { RejectChangeRequestCommandHandler } from '../31_RejectJobOnChangeRequest/commandHandler';
import { RejectChangeRequestCommand } from '../31_RejectJobOnChangeRequest/commands';
import { IgnoreChangeRequestCommand } from '../32_IgnoreChangeRequest/commands';
import { todoList, updateTodoList } from './todoListManager';

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

let isTodoProcessorInitialized = false;

export const initializeToDoJobToAssessChangeRequest = () => {
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

  eventBus.subscribe('ProcessTodoList', processTodoList);
  isTodoProcessorInitialized = true;
  console.log('[TodoProcessor] Ready to process todo list.');
};

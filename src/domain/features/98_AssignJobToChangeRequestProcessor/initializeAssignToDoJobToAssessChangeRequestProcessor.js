// src/domain/automation/toDoJobToAssessChangeRequestProcessor.js

import { eventBus } from '../../core/eventBus';
import { OnHoldJobCommandHandler } from '../23_PutJobOnHold/commandHandler';
import { PutJobOnHoldCommand } from '../23_PutJobOnHold/commands';
import { FlagJobForAssessmentCommandHandler } from '../29_JobChangeRequestAssessment/commandHandler';
import { FlagJobForAssessmentCommand } from '../29_JobChangeRequestAssessment/commands';
import { RejectChangeRequestCommandHandler } from '../31_RejectJobOnChangeRequest/commandHandler';
import { RejectChangeRequestCommand } from '../31_RejectJobOnChangeRequest/commands';
import { IgnoreChangeRequestCommand } from '../32_IgnoreChangeRequest/commands';
import { reconstructJobState } from '../../entities/Job/aggregate';
import { TODO_STATUS, todoList, updateTodoList } from '../99_changeRequestToJobReactionProcessor/todoListManager';
import { TodoListUpdatedEvent } from '../99_changeRequestToJobReactionProcessor/events';

// Initialize the processor only once to avoid multiple subscriptions
let isProcessorInitialized = false;

export const initializeToDoJobToAssessChangeRequest = () => {
  console.log('[initializeToDoJobToAssessChangeRequest] Initializing To-Do Job Processor'); 
  if (isProcessorInitialized) return;

  const processTodoList = () => {
    let isUpdated = false;
    todoList.forEach(item => {
      if (item.track === TODO_STATUS.TO_BE_ASSESSED) {
        const { jobId, changeRequestId, changedByUserId, description } = item;
        const job = reconstructJobState(jobId);

        if (!job) {
          console.warn(`[TodoProcessor] Job ${jobId} not found in state. Ignoring.`);
          updateTodoList(item.eventId, TODO_STATUS.ASSESSED);
          isUpdated = true;
          return;
        }

        switch (job.status) {
          case 'Pending':
            OnHoldJobCommandHandler.handle(
              PutJobOnHoldCommand(jobId, changedByUserId, `Change request raised: ${description}`, changeRequestId)
            );
            updateTodoList(item.eventId, TODO_STATUS.ASSESSED);
            break;
          case 'Started':
            FlagJobForAssessmentCommandHandler.handle(
              FlagJobForAssessmentCommand(jobId, changeRequestId, changedByUserId, `Change request needs assessment: ${description}`)
            );
            updateTodoList(item.eventId, TODO_STATUS.ASSESSMENT_TO_BE_PROVIDED);
            break;
          case 'Completed':
            console.warn(`[TodoProcessor] Job ${jobId} is already completed. Cannot apply change request.`);
            RejectChangeRequestCommandHandler.handle(
              RejectChangeRequestCommand(changeRequestId, changedByUserId, 'Job already completed. Cannot apply change request.')
            );
            updateTodoList(item.eventId, TODO_STATUS.ASSESSED);
            break;
          default:
            console.warn(`[TodoProcessor] Unknown or unsupported job status for ${jobId}: ${job.status}`);
            RejectChangeRequestCommandHandler.handle(
              IgnoreChangeRequestCommand(changeRequestId, changedByUserId, 'Unsupported job status.')
            );
            updateTodoList(item.eventId, TODO_STATUS.ASSESSED);
        }

        isUpdated = true;
      }
    });

    if (isUpdated) {
      console.log('[TodoProcessor] Publishing TodoListUpdated event');
      eventBus.publish(TodoListUpdatedEvent());
    }
  };

  // Subscribe to the JobAssignedToChangeRequest event to trigger processing
  eventBus.subscribe('CreatedJobAssignedToChangeRequest',() => {
  console.log('[Subscription] Received CreatedJobAssignedToChangeRequest, calling processTodoList...');
  processTodoList();
  });

  eventBus.subscribe('StartedJobAssignedToChangeRequest',() => {
  console.log('[Subscription] Received StartedJobAssignedToChangeRequest, calling processTodoList...');
  processTodoList();
  });

  eventBus.subscribe('CompleteJobAssignedToChangeRequest',() => {
  console.log('[Subscription] Received CompleteJobAssignedToChangeRequest, calling processTodoList...');
  processTodoList();
  });

  

  
  console.log('[TodoProcessor] Initialized and ready to process JobAssignedToChangeRequest events.');

  isProcessorInitialized = true;
  console.log('[TodoProcessor] Ready to process createdJobAssignedToChangeRequest events.');
};

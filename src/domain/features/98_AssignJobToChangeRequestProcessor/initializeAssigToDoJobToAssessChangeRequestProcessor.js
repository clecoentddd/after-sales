// src/domain/automation/toDoJobToAssessChangeRequestProcessor.js

import { eventBus } from '../../core/eventBus';
import { OnHoldJobCommandHandler } from '../23_PutJobOnHold/commandHandler';
import { PutJobOnHoldCommand } from '../23_PutJobOnHold/commands';
import { FlagJobForAssessmentCommandHandler } from '../29_JobChangeRequestAssessment/commandHandler';
import { FlagJobForAssessmentCommand } from '../29_JobChangeRequestAssessment/commands';
import { RejectChangeRequestCommandHandler } from '../31_RejectJobOnChangeRequest/commandHandler';
import { RejectChangeRequestCommand } from '../31_RejectJobOnChangeRequest/commands';
import { IgnoreChangeRequestCommand } from '../32_IgnoreChangeRequest/commands';
import { reconstructJobState } from '../../entities/Job/aggregate'; // Adjust the import path as needed
import { todoList, updateTodoList } from '../99_changeRequestToJobReactionProcessor/todoListManager';

// Initialize the processor only once to avoid multiple subscriptions

let isProcessorInitialized = false;

export const initializeToDoJobToAssessChangeRequest = () => {
  if (isProcessorInitialized) return;

  eventBus.subscribe('JobAssignedToChangeRequest', (event) => {
    const { jobId, changeRequestId, changedByUserId, description } = event.data;
    const job = reconstructJobState(jobId);

    if (!job) {
      console.warn(`[TodoProcessor] Job ${jobId} not found in state. Ignoring.`);
      return;
    }

     // Find the todo item related to this job and change request
    const todoItem = todoList.find(item => item.jobId === jobId && item.changeRequestId === changeRequestId);
    if (!todoItem) {
      console.warn(`[TodoProcessor] No todo item found for jobId ${jobId} and changeRequestId ${changeRequestId}.`);
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

     // Update the todo item status to 'Yes' after processing
    if (todoItem) {
      updateTodoList(todoItem.eventId, 'Yes');
    }

  });

  isProcessorInitialized = true;
  console.log('[TodoProcessor] Ready to process JobAssignedToChangeRequest events.');
};

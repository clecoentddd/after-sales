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
import { todoList, updateTodoList } from '../99_changeRequestToJobReactionProcessor/todoListManager';

// Initialize the processor only once to avoid multiple subscriptions
let isProcessorInitialized = false;

export const initializeToDoJobToAssessChangeRequest = () => {
  if (isProcessorInitialized) return;

  const processTodoList = () => {
    todoList.forEach(item => {
      if (item.track !== 'Yes') {
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

  // Subscribe to the JobAssignedToChangeRequest event to trigger processing
  eventBus.subscribe('JobAssignedToChangeRequest', processTodoList);

  isProcessorInitialized = true;
  console.log('[TodoProcessor] Ready to process JobAssignedToChangeRequest events.');
};

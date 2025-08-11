import { eventBus } from '@core/eventBus';
import { RejectChangeRequestCommandHandler } from '../31_RejectJobOnChangeRequest/commandHandler';
import { RejectChangeRequestCommand } from '../31_RejectJobOnChangeRequest/commands';
import { IgnoreChangeRequestCommand } from '../32_IgnoreChangeRequest/commands';
import { reconstructJobState } from '@entities/Job/aggregate';
import { TODO_STATUS, todoList, updateTodoList } from '../99_ToDoChangeRequestProcessManager/todoListManager';
import { TodoListUpdatedEvent } from '../99_ToDoChangeRequestProcessManager/events';

let isCompleteJobProcessorInitialized = false;

export const initializeToDoCompleteJobToAssessChangeRequest = () => {
  console.log('[initializeToDoCompleteJobToAssessChangeRequest] Initializing Complete Job To-Do Processor'); 
  if (isCompleteJobProcessorInitialized) return;

  const processCompleteJobTodoList = () => {
    console.log('[CompleteJobTodoProcessor] Processing todo list for completed jobs');
    let isUpdated = false;
    
    todoList.forEach(item => {
      if (item.track === TODO_STATUS.TO_BE_ASSESSED) {
        const { jobId, changeRequestId, changedByUserId, description } = item;
        const job = reconstructJobState(jobId);

        if (!job) {
          console.warn(`[CompleteJobTodoProcessor] Job ${jobId} not found in state. Ignoring.`);
          updateTodoList(item.eventId, TODO_STATUS.ASSESSED);
          isUpdated = true;
          return;
        }

        // Only process jobs with 'Completed' status
        if (job.status === 'Completed') {
          console.warn(`[CompleteJobTodoProcessor] Job ${jobId} is already completed. Cannot apply change request.`);
          RejectChangeRequestCommandHandler.handle(
            RejectChangeRequestCommand(changeRequestId, changedByUserId, 'Job already completed. Cannot apply change request.')
          );
          updateTodoList(item.eventId, TODO_STATUS.ASSESSED);
          isUpdated = true;
        } else if (job.status && !['Pending', 'Started', 'Completed'].includes(job.status)) {
          // Handle unknown/unsupported statuses
          console.warn(`[CompleteJobTodoProcessor] Unknown or unsupported job status for ${jobId}: ${job.status}`);
          RejectChangeRequestCommandHandler.handle(
            IgnoreChangeRequestCommand(changeRequestId, changedByUserId, 'Unsupported job status.')
          );
          updateTodoList(item.eventId, TODO_STATUS.ASSESSED);
          isUpdated = true;
        }
      }
    });

    if (isUpdated) {
      console.log('[CompleteJobTodoProcessor] Publishing TodoListUpdated event');
      eventBus.publish(TodoListUpdatedEvent());
    }
  };

  // Subscribe to CompleteJobAssignedToChangeRequest event
  eventBus.subscribe('CompleteJobAssignedToChangeRequest', () => {
    console.log('[CompleteJobSubscription] Received CompleteJobAssignedToChangeRequest, calling processCompleteJobTodoList...');
    processCompleteJobTodoList();
  });

  isCompleteJobProcessorInitialized = true;
  console.log('[CompleteJobTodoProcessor] Initialized and ready to process CompleteJobAssignedToChangeRequest events.');
};
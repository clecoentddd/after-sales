import { eventBus } from '@core/eventBus';
import { OnHoldJobCommandHandler } from './commandHandler';
import { PutJobOnHoldCommand } from './commands';
import { reconstructJobState } from '@entities/Job/aggregate';
import { TODO_STATUS, todoList, updateTodoList } from '../99_ToDoChangeRequestProcessManager/todoListManager';
import { TodoListUpdatedEvent } from '../99_ToDoChangeRequestProcessManager/events';

let isCreatedJobProcessorInitialized = false;

export const initializeToDoCreatedJobToAssessChangeRequest = () => {
  console.log('[initializeToDoCreatedJobToAssessChangeRequest] Initializing Created Job To-Do Processor'); 
  if (isCreatedJobProcessorInitialized) return;

  const processCreatedJobTodoList = () => {
    console.log('[CreatedJobTodoProcessor] Processing todo list for created/pending jobs');
    let isUpdated = false;
    
    todoList.forEach(item => {
      if (item.track === TODO_STATUS.TO_BE_ASSESSED) {
        const { jobId, changeRequestId, changedByUserId, description } = item;
        const job = reconstructJobState(jobId);

        if (!job) {
          console.warn(`[CreatedJobTodoProcessor] Job ${jobId} not found in state. Ignoring.`);
          updateTodoList(item.eventId, TODO_STATUS.ASSESSED);
          isUpdated = true;
          return;
        }

        // Only process jobs with 'Pending' status (Created jobs)
        if (job.status === 'Pending') {
          console.log(`[CreatedJobTodoProcessor] Processing pending job ${jobId} - putting on hold`);
          OnHoldJobCommandHandler.handle(
            PutJobOnHoldCommand(jobId, changedByUserId, `Change request raised: ${description}`, changeRequestId)
          );
          updateTodoList(item.eventId, TODO_STATUS.ASSESSED);
          isUpdated = true;
        }
      }
    });

    if (isUpdated) {
      console.log('[CreatedJobTodoProcessor] Publishing TodoListUpdated event');
      eventBus.publish(TodoListUpdatedEvent());
    }
  };

  // Subscribe to CreatedJobAssignedToChangeRequest event
  eventBus.subscribe('CreatedJobAssignedToChangeRequest', () => {
    console.log('[CreatedJobSubscription] Received CreatedJobAssignedToChangeRequest, calling processCreatedJobTodoList...');
    processCreatedJobTodoList();
  });

  isCreatedJobProcessorInitialized = true;
  console.log('[CreatedJobTodoProcessor] Initialized and ready to process CreatedJobAssignedToChangeRequest events.');
};
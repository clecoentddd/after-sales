import { eventBus } from '../../core/eventBus';
import { FlagJobForAssessmentCommandHandler } from './commandHandler';
import { FlagJobForAssessmentCommand } from './commands';
import { reconstructJobState } from '../../entities/Job/aggregate';
import { TODO_STATUS, todoList, updateTodoList } from '../99_ToDoChangeRequestProcessManager/todoListManager';
import { TodoListUpdatedEvent } from '../99_ToDoChangeRequestProcessManager/events';

let isStartedJobProcessorInitialized = false;

export const initializeToDoStartedJobToAssessChangeRequest = () => {
  console.log('[initializeToDoStartedJobToAssessChangeRequest] Initializing Started Job To-Do Processor'); 
  if (isStartedJobProcessorInitialized) return;

  const processStartedJobTodoList = () => {
    console.log('[StartedJobTodoProcessor] Processing todo list for started jobs');
    let isUpdated = false;
    
    todoList.forEach(item => {
      if (item.track === TODO_STATUS.TO_BE_ASSESSED) {
        const { jobId, changeRequestId, changedByUserId, description } = item;
        const job = reconstructJobState(jobId);

        if (!job) {
          console.warn(`[StartedJobTodoProcessor] Job ${jobId} not found in state. Ignoring.`);
          updateTodoList(item.eventId, TODO_STATUS.ASSESSED);
          isUpdated = true;
          return;
        }

        // Only process jobs with 'Started' status
        if (job.status === 'Started') {
          console.log(`[StartedJobTodoProcessor] Processing started job ${jobId} - flagging for assessment`);
          FlagJobForAssessmentCommandHandler.handle(
            FlagJobForAssessmentCommand(jobId, changeRequestId, changedByUserId, `Change request needs assessment: ${description}`)
          );
          updateTodoList(item.eventId, TODO_STATUS.ASSESSMENT_TO_BE_PROVIDED);
          isUpdated = true;
        }
      }
    });

    if (isUpdated) {
      console.log('[StartedJobTodoProcessor] Publishing TodoListUpdated event');
      eventBus.publish(TodoListUpdatedEvent());
    }
  };

  // Subscribe to StartedJobAssignedToChangeRequest event
  eventBus.subscribe('StartedJobAssignedToChangeRequest', () => {
    console.log('[StartedJobSubscription] Received StartedJobAssignedToChangeRequest, calling processStartedJobTodoList...');
    processStartedJobTodoList();
  });

  isStartedJobProcessorInitialized = true;
  console.log('[StartedJobTodoProcessor] Initialized and ready to process StartedJobAssignedToChangeRequest events.');
};
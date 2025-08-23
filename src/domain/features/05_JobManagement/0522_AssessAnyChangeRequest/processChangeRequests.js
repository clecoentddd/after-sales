// features/05_JobManagement/0522_ChangeRequest_Assessment/changeRequestProcessor.js
import { JobAggregate } from '@entities/Job/aggregate';
import { jobEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';
import { queryChangeRequestToProcess, updateToDo } from '../0521_ToDo_ChangeRequest_To_Assess/toDoDB';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const initializeChangeRequestProcessor = () => {
  console.log('[ChangeRequestProcessor] Initializing...');

  const unsubscribe = eventBus.subscribe('ChangeRequestJobAssigned', async (event) => {
    console.log(`[ChangeRequestProcessor] Received ChangeRequestJobAssigned event for job: ${event}`);
    try {
      await delay(500); // 500ms = 0.5 seconds
      await processChangeRequests();
      console.log('[ChangeRequestProcessor] Processing completed');
    } catch (error) {
      console.error('[ChangeRequestProcessor] Error processing event:', error);
    }
  });

  console.log('[ChangeRequestProcessor] Initialized successfully');
  return unsubscribe;
};

export const processChangeRequests = async () => {

  console.log("[processChangeRequests] Entering process...");
  const todos = queryChangeRequestToProcess();
  console.log("[processChangeRequests] Checking todos : ", todos);


  for (const todo of todos) {
    try {
      const jobEvents = jobEventStore.getEvents(todo.jobId);
      const jobAggregate = new JobAggregate();
      jobAggregate.replay(jobEvents);

      const command = {
        type: 'AssessChangeRequest',
        changeRequestId: todo.changeRequestId,
        jobId: todo.jobId,
        heldByUserId: 'system',
        reason: 'Change request assessment'
      };

      const event = jobAggregate.AssessChangeRequest(command);

      console.log("[processChangeRequests] Response from job aggregate", event.type);
      await jobEventStore.append(event);
      eventBus.publish(event);

    } catch (error) {
      console.error('Error processing change request:', error);
    }
  }
};



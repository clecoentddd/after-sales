// features/05_JobManagement/0521_ToDo_ChangeRequest_To_Assess/initializeToDoProjection.js
import { addToDo, getToDoDB, clearToDoDB } from './toDoDB';
import { eventBus } from '@core/eventBus';

export const initializeToDoProjection = () => {

  console.log('[ToDoProjection] Initializing subscription for ChangeRequestJobAssigned events...');

  const unsubscribe = eventBus.subscribe('ChangeRequestJobAssigned', (event) => {
    console.log(`[ToDoProjection] Received ChangeRequestJobAssigned event for job: ${event.aggregateId}, changeRequest: ${event.data.changeRequestId}`);

    try {
      const existingTodo = getToDoDB().some(todo => todo.changeRequestId === event.data.changeRequestId);

      if (existingTodo) {
        console.log(`[ToDoProjection] Todo already exists for change request ${event.data.changeRequestId}, skipping creation`);
        return;
      }

      console.log(`[ToDoProjection] Creating new todo for change request ${event.data.changeRequestId}`);
      addToDo({
        changeRequestId: event.data.changeRequestId,
        jobId: event.aggregateId,
      });

      console.log(`[ToDoProjection] Successfully added todo. Total todos: ${getToDoDB().length}`);
    } catch (error) {
      console.error(`[ToDoProjection] Error processing event:`, error);
    }
  });

  return unsubscribe;
};

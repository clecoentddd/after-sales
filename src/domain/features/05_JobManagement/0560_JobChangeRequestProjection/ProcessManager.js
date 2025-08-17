import { eventBus } from '@core/eventBus';
import { jobChangeRequestProjection } from './JobChangeRequestProjection';

export const initializeProcessManager = () => {
  const processPendingTodos = async () => {
    const pendingRows = jobChangeRequestProjection.getAll().filter(r => r.todo);

    pendingRows.forEach(row => {
      console.log('[ProcessManager] Processing row:', row);

      // Simulate putting the job on hold
      console.log(`[ProcessManager] Putting job ${row.jobId} on hold`);

      // Mark row as processed
      jobChangeRequestProjection.updateTodo(row.requestId, row.changeRequestId, false);

      console.log('[ProcessManager] Done processing row:', row);
    });
  };

  // Subscribe to events; any relevant event triggers processing all pending todos
  eventBus.subscribe('CreatedJobAssignedToChangeRequest', async (event) => {
    console.log('[ProcessManager] Received event:', event);
    await processPendingTodos();
  });

  // You can add more event types here if needed
};

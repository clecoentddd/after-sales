import { eventBus } from '@core/eventBus';
import { jobChangeRequestProjection } from '../0560_JobChangeRequestMappingProjection/JobChangeRequestProjection';
import { PutJobOnHoldCommand } from '../0511_PutJobOnHold/commands';
import { OnHoldJobCommandHandler } from '../0511_PutJobOnHold/commandHandler';

export const initializeProcessManager = () => {
  const processPendingTodos = async () => {
    // Get todos that are still pending or failed
    const pendingRows = jobChangeRequestProjection.getAll()
      .filter(r => r.todo === 'ToDo' || r.todo === 'Failed');

    for (const row of pendingRows) {
      console.log('[ProcessManager] Processing row:', row);

      try {
        // Step 1: Build command
        const command = PutJobOnHoldCommand(
          row.jobId,
          'system',                    // automated user
          'Change request assigned',    // reason
          row.changeRequestId
        );

        // Step 2: Send command to Command Handler
        const handler = new OnHoldJobCommandHandler();
        const onHoldEvent = await handler.execute(command);

        // Step 3: Update todo status
        if (onHoldEvent) {
          jobChangeRequestProjection.updateTodo(row.requestId, row.changeRequestId, 'Done');
          console.log(`[ProcessManager] Job ${row.jobId} flagged as OnHold.`);
        } else {
          jobChangeRequestProjection.updateTodo(row.requestId, row.changeRequestId, 'Failed');
          console.warn(`[ProcessManager] Job ${row.jobId} could not be put on hold.`);
        }

      } catch (error) {
        // Command handler threw an error; mark todo as failed
        jobChangeRequestProjection.updateTodo(row.requestId, row.changeRequestId, 'Failed');
        console.error('[ProcessManager] Error processing row:', row, error);
      }
    }
  };

  // Subscribe to relevant events; triggers processing all pending todos
  eventBus.subscribe('JobAssignedToChangeRequest', async (event) => {
    console.log('[ProcessManager] Received event:', event);
    await processPendingTodos();
  });
};

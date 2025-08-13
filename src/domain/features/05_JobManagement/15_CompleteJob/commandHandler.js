import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore'; // Import the event store
import { jobCompletedEnrichedEvent } from '@events/jobCompletedEnrichedEvent';
import { JobAggregate } from '@entities/Job/aggregate'; 

export const completeJobCommandHandler = {
  async handle(command) {
    console.log(`[CompleteJobCommandHandler] Handling command: ${command.type}`, command);

    switch (command.type) {
      case 'CompleteJob': {
        try {
          // 1. Load all events for this job from the event store
          const events = jobEventStore.getEvents().filter(e => e.aggregateId === command.jobId);
          console.log('[CompleteJobCommandHandler] Events to replay:', events);

          // 2. Reconstruct the aggregate state by replaying events
          const jobAggregate = new JobAggregate();
          jobAggregate.replay(events);

          // 3. Log the aggregate state for debugging
          console.log('[CompleteJobCommandHandler] Aggregate state after replay:', {
            jobId: jobAggregate.jobId,
            requestId: jobAggregate.requestId,
            changeRequestId: jobAggregate.changeRequestId,
            status: jobAggregate.status,
          });

          // 4. Let the aggregate decide whether it can be completed
          const jobCompletedEvent = jobAggregate.complete(command);

          if (!jobCompletedEvent) {
            console.warn(`[CompleteJobCommandHandler] Job ${command.jobId} is already completed or cannot be completed.`);
            return {
              success: false,
              message: `Job ${command.jobId} is already completed or cannot be completed.`,
              code: 'JOB_ALREADY_COMPLETED',
            };
          }

          // 5. Apply the event to the aggregate to update its state
          jobAggregate.apply(jobCompletedEvent);

          // 6. Publish the minimal event-sourcing event
          jobEventStore.append(jobCompletedEvent);
          console.log('[CompleteJobCommandHandler] Published JobCompleted event:', jobCompletedEvent);

          eventBus.publish(jobCompletedEvent);
          
          // 7. Build and publish the enriched event
          const enrichedEvent = jobCompletedEnrichedEvent({
            jobId: jobAggregate.jobId,
            requestId: jobAggregate.requestId,
            changeRequestId: jobAggregate.changeRequestId,
            quotationId: jobAggregate.quotationId,
            completionDetails: jobAggregate.completionDetails,
            jobDetails: jobAggregate.jobDetails,
            completedByUserId: jobAggregate.completedByUserId,
            completedAt: jobAggregate.completedAt,
          });
          eventBus.publish(enrichedEvent);
          console.log('[CompleteJobCommandHandler] Published enriched JobCompleted event:', enrichedEvent);

          return { success: true, event: jobCompletedEvent };
        } catch (error) {
          console.error(`[CompleteJobCommandHandler] Error completing job:`, error.message);
          return {
            success: false,
            message: `Failed to complete job: ${error.message}`,
            code: 'JOB_COMPLETION_FAILED',
          };
        }
      }

      default:
        console.warn(`[CompleteJobCommandHandler] Unknown command type: ${command.type}`);
        return { success: false, message: 'Unknown command' };
    }
  }
};

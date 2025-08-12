import { eventBus } from '@core/eventBus';
import { JobRepository } from '@entities/Job/repository';
import { jobCompletedEnrichedEvent } from '@events/jobCompletedEnrichedEvent';

const jobRepository = new JobRepository();

export const completeJobCommandHandler = {
  async handle(command) {
    console.log(`[CompleteJobCommandHandler] Handling command: ${command.type}`, command);

    switch (command.type) {
      case 'CompleteJob': {
        // Load aggregate (replay hidden inside repository)
        const job = await jobRepository.getById(command.jobId);
        console.log("[completeJobCommandHandler] jobRepository Job is", job);

        // Let aggregate decide whether it can complete
        const jobCompletedEvent = job.complete(command);
        if (!jobCompletedEvent) {
          return {
            success: false,
            message: `Job ${command.jobId} is already completed.`,
            code: 'JOB_ALREADY_COMPLETED'
          };
        }
           // Log the jobCompletedEvent with formatted JSON
        console.log("[CompleteJobCommandHandler] Job completed event:", JSON.stringify(jobCompletedEvent, null, 2));

        // Apply the event to the aggregate to update its state
        job.apply(jobCompletedEvent);

        // Publish minimal ES event
        eventBus.publish(jobCompletedEvent);

        // Build and publish enriched event from aggregate state
        // Build and publish enriched event with explicit parameters

        const enrichedEvent = jobCompletedEnrichedEvent({
          jobId: job.jobId,
          requestId: job.requestId,
          changeRequestId: job.changeRequestId,
          quotationId: job.quotationId,
          completionDetails: job.completionDetails,
          jobDetails: job.jobDetails,
          completedByUserId: job.completedByUserId,
          completedAt: job.completedAt
        });
        eventBus.publish(enrichedEvent);

        return { success: true, event: jobCompletedEvent };
      }

      default:
        console.warn(`[CompleteJobCommandHandler] Unknown command type: ${command.type}`);
        return { success: false, message: 'Unknown command' };
    }
  }
};

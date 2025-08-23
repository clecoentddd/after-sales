import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore';
import { JobAggregate } from '@entities/Job/aggregate';

export const FlagJobForAssessmentCommandHandler = {
  handle(command) {
    console.log(`[FlagJobForAssessmentCommandHandler] Handling command: ${command.type}`, command);

    switch (command.type) {
      case 'FlagJobForAssessmentCommand':
        // Step 1: Fetch all events from the event store
        console.log(`[FlagJobForAssessmentCommandHandler] Fetching all events from event store...`);
        const allEvents = jobEventStore.getEvents();
        console.log(`[FlagJobForAssessmentCommandHandler] Total events in store: ${allEvents.length}`);

        // Step 2: Filter events for the specific jobId
        console.log(`[FlagJobForAssessmentCommandHandler] Filtering events for jobId: ${command.jobId}`);
        const jobEvents = allEvents.filter(e => e.aggregateId === command.jobId);
        console.log(`[FlagJobForAssessmentCommandHandler] Retrieved ${jobEvents.length} event(s) for jobId: ${command.jobId}`);


        const aggregate = new JobAggregate();
        aggregate.replay(jobEvents);
        console.log(`[FlagJobForAssessmentCommandHandler] Aggregate state after replay:`, aggregate);

        const event = aggregate.flagForAssessment(command);

        if (!event) {
          console.warn(`[FlagJobForAssessmentCommandHandler] flagForAssessment returned null or undefined for jobId ${command.jobId} — likely invalid state transition.`);
          return { success: false, error: 'Invalid job state for flagForAssessment' };
        }

        console.log(`[FlagJobForAssessmentCommandHandler] Event created:`, event);

        jobEventStore.append(event);
        console.log(`[FlagJobForAssessmentCommandHandler] Event appended to store.`);

        eventBus.publish(event);
        console.log(`[FlagJobForAssessmentCommandHandler] Event published on event bus.`);

        return { success: true, event };

      default:
        console.warn(`[FlagJobForAssessmentCommandHandler] Unknown command type: ${command.type}`);
        return { success: false, error: 'Unknown command type' };
    }
  }
};
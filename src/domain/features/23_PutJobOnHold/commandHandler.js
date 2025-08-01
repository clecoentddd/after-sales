import { eventBus } from '../../core/eventBus';
import { jobEventStore } from '../../core/eventStore';
import { JobAggregate } from '../../entities/Job/aggregate';

export const OnHoldJobCommandHandler = {
  handle(command) {
    console.log(`[OnHoldJobCommandHandler] Handling command: ${command.type}`, command);

    switch (command.type) {
      case 'PutJobOnHold':
        console.log(`[OnHoldJobCommandHandler] Fetching events for jobId: ${command.jobId}`);
        const jobEvents = jobEventStore.getEvents().filter(e => e.data.jobId === command.jobId);
        console.log(`[OnHoldJobCommandHandler] Retrieved ${jobEvents.length} event(s) for jobId: ${command.jobId}`);

        const aggregate = new JobAggregate();
        aggregate.replay(jobEvents);
        console.log(`[OnHoldJobCommandHandler] Aggregate state after replay:`, aggregate);

        const event = aggregate.putOnHold(command);

        if (!event) {
          console.warn(`[OnHoldJobCommandHandler] putOnHold returned null or undefined for jobId ${command.jobId} — likely invalid state transition.`);
          return { success: false, error: 'Invalid job state for putOnHold' };
        }

        console.log(`[OnHoldJobCommandHandler] Event created:`, event);

        jobEventStore.append(event);
        console.log(`[OnHoldJobCommandHandler] Event appended to store.`);

        eventBus.publish(event);
        console.log(`[OnHoldJobCommandHandler] Event published on event bus.`);

        return { success: true, event };

      default:
        console.warn(`[OnHoldJobCommandHandler] Unknown command type: ${command.type}`);
        return { success: false, error: 'Unknown command type' };
    }
  }
};

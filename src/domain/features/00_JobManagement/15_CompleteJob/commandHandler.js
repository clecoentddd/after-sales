// src/domain/features/15_CompleteJob/commandHandler.js

import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore';
import { JobAggregate } from '@entities/Job/aggregate'; // shared aggregate

export const completeJobCommandHandler = {
  handle(command) {
    console.log(`[CompleteJobCommandHandler] Handling command: ${command.type}`, command);

    switch (command.type) {
      case 'CompleteJob': {
        // Rehydrate aggregate from event history
        const events = jobEventStore
          .getEvents()
          .filter(e => e.data.jobId === command.jobId);

        const aggregate = new JobAggregate();
        aggregate.replay(events);

        const event = aggregate.complete(command);
        if (!event) {
          return {
            success: false,
            message: `Job ${command.jobId} is already completed.`,
            code: 'JOB_ALREADY_COMPLETED'
          };
        }

        jobEventStore.append(event);
        eventBus.publish(event);

        return { success: true, event };
      }

      default:
        console.warn(`[CompleteJobCommandHandler] Unknown command type: ${command.type}`);
        return { success: false, message: 'Unknown command' };
    }
  }
};

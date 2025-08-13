// src/domain/features/11_CreateJobAutomation/commandHandler.js
import { jobEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';
import { JobAggregate } from '@entities/Job/aggregate';

export const createJobCommandHandler = {
  handle(command) {
    if (command.type !== 'CreateJobFromApprovedQuotation') {
      console.warn(`[CreateJobCommandHandler] Unknown command type: ${command.type}`);
      return { success: false, message: 'Unsupported command' };
    }

    // Delegate job creation to the aggregate
    const jobCreatedEvent = JobAggregate.create(command);

    // Persist and publish the event
    jobEventStore.append(jobCreatedEvent);
    eventBus.publish(jobCreatedEvent);

    return { success: true, event: jobCreatedEvent };
  }
};

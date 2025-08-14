// startJob/commandHandler.js

import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore';
import { JobAggregate } from '@entities/Job/aggregate'; 

export const startJobCommandHandler = {
  handle(command) {
    console.log(`[StartJobCommandHandler] Handling command: ${command.type}`, command);

    // Rebuild aggregate state from events related to this job
    const events = jobEventStore.getEvents().filter(e => e.aggregateId === command.jobId);
    const jobAggregate = new JobAggregate();
    jobAggregate.replay(events);

    try {
      // Attempt to start the job, may throw if status !== 'Pending'
      const event = jobAggregate.start(command);

      // Persist and publish event
      jobEventStore.append(event);
      eventBus.publish(event);

      console.log(`[StartJobCommandHandler] Job started event published for jobId: ${command.jobId}`);
      return { success: true, event };
    } catch (error) {
      console.error(`[StartJobCommandHandler] Error starting job:`, error.message);
      return { success: false, error: error.message };
    }
  }
};

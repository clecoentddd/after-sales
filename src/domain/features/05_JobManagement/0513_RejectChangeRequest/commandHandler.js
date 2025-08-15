// src/domain/features/05_JobManagement/0513_RejectChangeRequestForCompletedJob/commandHandler.js
import { jobEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';
import { JobAggregate } from '@entities/Job/aggregate';

export const RejectChangeRequestForCompletedJobCommandHandler = {
  handle: (command) => {
    const { aggregateId, requestId, changeRequestId, reason, rejectedBy } = command;

    // Step 1: Rebuild aggregate from events
    const allEvents = jobEventStore.getEvents()
      .filter(e => e.aggregateId === aggregateId)
      .sort((a, b) => new Date(a.metadata?.timestamp || a.timestamp) - new Date(b.metadata?.timestamp || b.timestamp));

    const aggregate = new JobAggregate();
    allEvents.forEach(e => aggregate.apply(e));

    // Step 2: Confirm job is completed
    if (!aggregate.completedAt) {
      console.log(`[RejectChangeRequestForCompletedJobCommandHandler] Job ${aggregateId} is not completed. Skipping rejection.`);
      return;
    }

    // Step 3: Ask the aggregate to reject the change request
    const rejectionEvent = aggregate.rejectChangeRequest({
      requestId,
      changeRequestId,
      reason,
      rejectedBy
    });

    // Step 4: Append & publish the event if returned
    if (rejectionEvent) {
      jobEventStore.append(rejectionEvent);
      eventBus.publish(rejectionEvent);
      console.log(`[RejectChangeRequestForCompletedJobCommandHandler] Rejected change request ${changeRequestId} for completed job ${aggregateId}`);
    }
  }
};

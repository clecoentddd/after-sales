// src/domain/features/05_JobManagement/0513_RejectChangeRequestForCompletedJob/commandHandler.js
import { jobEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';
import { JobAggregate } from '@entities/Job/aggregate';

export const RejectChangeRequestForCompletedJobCommandHandler = {
  handle: (command) => {
    const { aggregateId, requestId, changeRequestId, reason, rejectedBy } = command;

    console.log(`[RejectCRHandler] Handling RejectChangeRequestForCompletedJobCommand`, command);

    // Step 1: Rebuild aggregate from events
    const allEvents = jobEventStore.getEvents()
      .filter(e => e.aggregateId === aggregateId)
      .sort(
        (a, b) =>
          new Date(a.metadata?.timestamp || a.timestamp) -
          new Date(b.metadata?.timestamp || b.timestamp)
      );

    console.log(`[RejectCRHandler] Found ${allEvents.length} past events for job ${aggregateId}`);

    const aggregate = new JobAggregate();
    allEvents.forEach(e => {
      console.log(`[RejectCRHandler] Applying event:`, e.type, e);
      aggregate.apply(e);
    });

    console.log(`[RejectCRHandler] Aggregate state after replay:`, {
      status: aggregate.status,
      completedAt: aggregate.completedAt,
      CRstatus: aggregate.CRstatus,
    });

    // Step 2: Confirm job is completed
    if (!aggregate.completedAt) {
      console.warn(`[RejectCRHandler] Job ${aggregateId} is not completed. Skipping rejection.`);
      return null;
    }

    // Step 3: Ask the aggregate to reject the change request
    const rejectionEvent = aggregate.rejectChangeRequest({
      requestId,
      changeRequestId,
      reason,
      rejectedBy,
    });

    console.log(`[RejectCRHandler] Aggregate produced rejectionEvent:`, rejectionEvent);

    // Step 4: Append & publish the event if returned
    if (rejectionEvent) {
      jobEventStore.append(rejectionEvent);
      eventBus.publish(rejectionEvent);
      console.log(`[RejectCRHandler] Rejected change request ${changeRequestId} for completed job ${aggregateId}`);
      return rejectionEvent; // ✅ return it so the test can assert
    }

    console.warn(`[RejectCRHandler] No event produced for command`, command);
    return null;
  },
};


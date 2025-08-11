// src/domain/features/15_CompleteJob/events/jobCompletedEnrichedEvent.js

export const jobCompletedEnrichedEvent = (aggregate, userId) => {
  return {
    type: 'JobHasBeenCompleted',
    aggregateId: aggregate.jobId,
    aggregateType: 'Job',
    data: {
      requestId: aggregate.requestId,
      changeRequestId: aggregate.changeRequestId,
      customerId: aggregate.customerId,
      details: aggregate.details,
      approvedByUserId: userId,
      approvedAt: new Date().toISOString(),
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  };
};

// src/domain/features/15_CompleteJob/events/jobCompletedEnrichedEvent.js

export const jobCompletedEnrichedEvent = (aggregate) => {
  return {
    type: 'JobHasBeenCompleted',
    aggregateId: aggregate.jobId,
    aggregateType: 'Job',
    data: {
      requestId: aggregate.requestId,
      changeRequestId: aggregate.changeRequestId,
      quotationId: aggregate.quotationId,
      completionDetails: aggregate.completionDetails,
      jobDetails: aggregate.jobDetails,
      completedByUserId: aggregate.completedByUserId,
      completedAt: aggregate.completedAt,
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  };
};

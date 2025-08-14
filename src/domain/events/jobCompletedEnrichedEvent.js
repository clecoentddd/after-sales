// src/domain/features/0503_CompleteJob/events/jobCompletedEnrichedEvent.js

export const jobCompletedEnrichedEvent = (aggregate) => {
  return {
    type: 'JobHasBeenCompleted',
    aggregateId: aggregate.jobId,
    aggregateType: 'Job',
    requestId: aggregate.requestId,
    changeRequestId: aggregate.changeRequestId,
    data: {
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

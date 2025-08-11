// src/domain/features/15_CompleteJob/events/jobCompletedEnrichedEvent.js

export const jobCompletedEnrichedEvent = (aggregate, userId) => {
  return {
    type: 'JobHasBeenCompleted',
    aggregateId: aggregate.jobId,
    aggregateType: 'Job',
    data: {
      requestId: aggregate.requestId,
      changeRequestId: aggregate.changeRequestId,
      quotationId: aggregate.quotationId,
      quotationDetails: aggregate.quotationDetails,
      quotationStatus: aggregate.status,
      customerId: aggregate.customerId,
      jobDetails: aggregate.jobDetails,
      approvedByUserId: userId,
      approvedAt: new Date().toISOString(),
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  };
};

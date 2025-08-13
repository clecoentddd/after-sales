export const JobCreatedEvent = (jobId, requestId, changeRequestId, quotationId, jobDetails, status = 'Pending') => ({
  type: 'JobCreated',
  aggregateId: jobId,
  aggregateType: 'Job',
  requestId,
  changeRequestId, 
  data: {
    quotationId,
    jobDetails,
    status, // Include status to track the initial state
  },
  metadata: {
    timestamp: new Date().toISOString(),
  },
});
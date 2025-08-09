export const JobCreatedEvent = (jobId, quotationId, requestId, changeRequestId, jobDetails, status = 'Pending') => ({
  type: 'JobCreated',
  aggregateId: jobId,
  aggregateType: 'Job',
  data: {
    quotationId,
    requestId,
    changeRequestId,
    jobDetails,
    status
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});
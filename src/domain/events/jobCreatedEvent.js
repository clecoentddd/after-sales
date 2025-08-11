export const JobCreatedEvent = (jobId, requestId, changeRequestId,quotationId, jobDetails, status = 'Pending') => ({
  type: 'JobCreated',
  aggregateId: jobId,
  aggregateType: 'Job',
  data: {
    requestId,
    changeRequestId,
    quotationId,
    jobDetails,
    status
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});
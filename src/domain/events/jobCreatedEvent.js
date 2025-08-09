export const JobCreatedEvent = (jobId, quotationId, requestId, changeRequestId, jobDetails, status = 'Pending') => ({
  type: 'JobCreated',
  data: {
    jobId,
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
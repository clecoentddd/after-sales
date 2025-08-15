export const JobCompletedChangeRequestRejectedEvent = (jobId, requestId, changeRequestId, reason) => ({
  type: 'JobChangeRequestRejected',
  aggregateId: jobId,
  aggregateType: 'Job',
  requestId: requestId,
  changeRequestId: changeRequestId,
  data: {
    reason
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});
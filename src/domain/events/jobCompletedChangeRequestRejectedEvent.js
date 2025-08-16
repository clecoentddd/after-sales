export const JobCompletedChangeRequestRejectedEvent = (jobId, requestId, changeRequestId, reason, rejectedBy) => ({
  type: 'JobChangeRequestRejected',
  aggregateId: jobId,
  aggregateType: 'Job',
  requestId: requestId,
  changeRequestId: changeRequestId,
  data: {
    reason,
    rejectedBy,
    CRstatus: 'Rejected'
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});
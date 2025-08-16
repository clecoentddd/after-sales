export const RejectChangeRequestForCompletedJobCommand = (jobId, requestId, changeRequestId, reason, rejectedBy = 'system') => ({
  type: 'RejectChangeRequestForCompletedJobCommand',
  aggregateId: jobId,
  requestId,
  changeRequestId,
});
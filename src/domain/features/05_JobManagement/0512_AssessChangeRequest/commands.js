export const FlagJobForAssessmentCommand = (jobId, requestId, changeRequestId, changedByUserId, reason) => ({
  type: 'FlagJobForAssessmentCommand',
  jobId,
  requestId,
  changeRequestId,
  changedByUserId,
  reason
});
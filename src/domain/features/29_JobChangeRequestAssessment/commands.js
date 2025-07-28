export const FlagJobForAssessmentCommand = (jobId, changeRequestId, changedByUserId, reason) => ({
  type: 'FlagJobForAssessmentCommand',
  jobId,
  changeRequestId,
  changedByUserId,
  reason
});
export const JobFlaggedForAssessmentEvent = (
  aggregateId,
  requestId,
  changeRequestId,
  flaggedByUserId,
  reason
) => ({
  type: 'ChangeRequestReceivedPendingAssessment',
  aggregateType: "Job",
  aggregateId,
  requestId,
  changeRequestId,
  data: {
    flaggedByUserId,
    reason,
    flaggedAt: new Date().toISOString(),
    CRstatus: 'ChangeRequestReceivedPendingAssessment'
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

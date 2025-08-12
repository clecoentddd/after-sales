/**
 * Factory function for creating a JobFlaggedForAssessmentEvent.
 * This event indicates a job has received a change request and needs assessment.
 * 
 * @param {string} jobId - The ID of the job to flag.
 * @param {string} requestId - The related request ID.
 * @param {string} changeRequestId - The ID of the related change request.
 * @param {string} flaggedByUserId - User ID who flagged the job.
 * @param {string} reason - Reason for flagging the job.
 * @returns {object} The JobFlaggedForAssessmentEvent object.
 */
export const JobFlaggedForAssessmentEvent = (
  jobId,
  requestId,
  changeRequestId,
  flaggedByUserId,
  reason
) => ({
  type: 'ChangeRequestReceivedPendingAssessment',
  aggregateType: "Job",
  data: {
    jobId,
    requestId,
    changeRequestId,
    flaggedByUserId,
    reason,
    flaggedAt: new Date().toISOString(),
    status: 'ChangeRequestReceivedPendingAssessment'
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

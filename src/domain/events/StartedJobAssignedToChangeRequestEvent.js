// src/domain/features/99_changeRequestToJobReactionProcessor/StartedJobAssignedToChangeRequestEvent.js
export const StartedJobAssignedToChangeRequestEvent = (jobId, changeRequestId, changedByUserId, description) => ({
  type: 'StartedJobAssignedToChangeRequest',
  aggregateType: "Request",
  data: {
    jobId,
    changeRequestId,
    changedByUserId,
    description,
    timestamp: new Date().toISOString()
  }
});
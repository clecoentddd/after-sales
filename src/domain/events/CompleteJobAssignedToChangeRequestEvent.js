// src/domain/features/99_changeRequestToJobReactionProcessor/CompleteJobAssignedToChangeRequestEvent.js
export const CompleteJobAssignedToChangeRequestEvent = (jobId, changeRequestId, changedByUserId, description) => ({
  type: 'CompleteJobAssignedToChangeRequest',
  aggregateType: "Job",
  data: {
    jobId,
    changeRequestId,
    changedByUserId,
    description,
    timestamp: new Date().toISOString()
  }
});
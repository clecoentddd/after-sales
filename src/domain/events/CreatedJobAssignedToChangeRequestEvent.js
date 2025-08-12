// src/domain/features/99_changeRequestToJobReactionProcessor/CreatedJobAssignedToChangeRequestEvent.js
export const CreatedJobAssignedToChangeRequestEvent = (jobId, changeRequestId, changedByUserId, description) => ({
  type: 'CreatedJobAssignedToChangeRequest',
  aggregateType: "Job",
  data: {
    jobId,
    changeRequestId,
    changedByUserId,
    description,
    timestamp: new Date().toISOString()
  }
});
// src/domain/features/99_changeRequestToJobReactionProcessor/assignStartedJobToChangeRequestCommand.js
export const AssignStartedJobToChangeRequestCommand = (jobId, changeRequestId, changedByUserId, description) => ({
  type: 'AssignStartedJobToChangeRequestCommand',
  data: {
    jobId,
    changeRequestId,
    changedByUserId,
    description,
    timestamp: new Date().toISOString()
  }
});
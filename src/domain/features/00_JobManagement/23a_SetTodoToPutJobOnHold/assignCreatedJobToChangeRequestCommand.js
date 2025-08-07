// src/domain/features/99_changeRequestToJobReactionProcessor/assignCreatedJobToChangeRequestCommand.js
export const AssignCreatedJobToChangeRequestCommand = (jobId, changeRequestId, changedByUserId, description) => ({
  type: 'AssignCreatedJobToChangeRequestCommand',
  data: {
    jobId,
    changeRequestId,
    changedByUserId,
    description,
    timestamp: new Date().toISOString()
  }
});

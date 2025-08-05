// src/domain/features/99_changeRequestToJobReactionProcessor/assignCompleteJobToChangeRequestCommand.js
export const AssignCompleteJobToChangeRequestCommand = (jobId, changeRequestId, changedByUserId, description) => ({
  type: 'AssignCompleteJobToChangeRequestCommand',
  data: {
    jobId,
    changeRequestId,
    changedByUserId,
    description,
    timestamp: new Date().toISOString()
  }
});
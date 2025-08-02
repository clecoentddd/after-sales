// src/domain/events/JobAssignedToChangeRequestEvent.js

export function JobAssignedToChangeRequestEvent(jobId, changeRequestId, userId, description) {
  return {
    type: 'JobAssignedToChangeRequest',
    data: {
      jobId,
      changeRequestId,
      userId,
      description,
      timestamp: new Date().toISOString(),
    }
  };
}

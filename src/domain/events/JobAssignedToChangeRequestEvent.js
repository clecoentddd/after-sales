// src/domain/events/JobAssignedToChangeRequestEvent.js

export function JobAssignedToChangeRequestEvent(jobId, changeRequestId, userId, description) {
  return {
    type: 'JobAssignedToChangeRequest',
    aggregateType: "Job",
    data: {
      jobId,
      changeRequestId,
      userId,
      description,
      timestamp: new Date().toISOString(),
    }
  };
}

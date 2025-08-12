// src/domain/events/ChangeRequestRejectedEvent.js

// src/domain/events/ChangeRequestRejectedEvent.js

export function ChangeRequestAssignmentRejectedEvent(changeRequestId, requestId, reason) {
  return {
    type: 'ChangeRequestAssigmentRejected',
    aggregateType: "ChangeRequest",
    data: {
      changeRequestId,
      requestId,
      reason,
      timestamp: new Date().toISOString(),
    }
  };
}

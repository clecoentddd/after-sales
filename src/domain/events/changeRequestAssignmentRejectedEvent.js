// src/domain/events/ChangeRequestRejectedEvent.js

// src/domain/events/ChangeRequestRejectedEvent.js

export function ChangeRequestAssignmentRejectedEvent(requestId, changeRequestId, reason) {
  return {
    type: 'ChangeRequestAssigmentRejected',
    aggregateId: requestId,
    aggregateType: "Request",
    data: {
      changeRequestId,
      requestId,
      reason,
      timestamp: new Date().toISOString(),
    }
  };
}

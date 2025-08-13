// src/domain/events/ChangeRequestRejectedEvent.js

// src/domain/events/ChangeRequestRejectedEvent.js

export function ChangeRequestRejectedEvent(changeRequestId, requestId, reason) {
  return {
    type: 'ChangeRequestRejected',
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

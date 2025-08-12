// src/domain/events/ChangeRequestRejectedEvent.js

// src/domain/events/ChangeRequestRejectedEvent.js

export function ChangeRequestRejectedDueToClosedRequest(changeRequestId, requestId, reason) {
  return {
    type: 'ChangeRequestRejectedDueToClosedRequest',
    aggregateType: "ChangeRequest",
    data: {
      requestId,
      reason,
      timestamp: new Date().toISOString(),
    }
  };
}

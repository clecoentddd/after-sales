// src/domain/events/ChangeRequestRejectedEvent.js

// src/domain/events/ChangeRequestRejectedEvent.js

export function ChangeRequestRejectedDueToClosedRequest(requestId, changeRequestId, reason) {
  return {
    type: 'ChangeRequestRejectedDueToClosedRequest',
    aggregatId: requestId,
    aggregateType: "ChangeRequest",
    changeRequestId: requestId,
    data: {
      reason,
      timestamp: new Date().toISOString(),
    }
  };
}

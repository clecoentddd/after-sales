// src/domain/features/changeRequested/events.js

export const ChangeRequestRaisedEvent = (changeRequestId, requestId, changedByUserId, description, versionId) => ({
  type: 'ChangeRequestRaised',
  aggregateType: "ChangeRequest",
  data: {
    changeRequestId,   // unique id for this change request
    requestId,         // parent request id
    changedByUserId,
    description,
    versionId,         // new version of the request after this change
    raisedAt: new Date().toISOString(),
    status: 'Pending'
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

// src/domain/features/changeRequested/events.js

export const ChangeRequestRaisedEvent = (requestId, changeRequestId, changedByUserId, description, versionId) => ({
  type: 'ChangeRequestRaised',
  aggregateId: requestId,
  aggregateType: "Request",
  changeRequestId,   // unique id for this change request
  changedByUserId,
  data: {
    description,
    versionId,         // new version of the request after this change
    raisedAt: new Date().toISOString(),
    status: 'Pending'
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

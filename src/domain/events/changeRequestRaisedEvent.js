// src/domain/features/changeRequested/events.js

export const ChangeRequestRaisedEvent = (requestId, changeRequestId, changedByUserId, description, versionId) => ({
  type: 'ChangeRequestRaised',
  aggregateType: "ChangeRequest",
  aggregateId: requestId,
  changeRequestId,   // unique id for this change request
  data: {
    description,
    versionId,         // new version of the request after this change
    changedByUserId,
    status: 'Pending'
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

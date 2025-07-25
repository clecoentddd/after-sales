// src/domain/features/changeRequested/events.js

export const ChangeRequestRaisedEvent = (changeRequestId, requestId, changedByUserId, description) => ({
  type: 'ChangeRequestRaised',
  data: {
    changeRequestId,   // passed from outside now
    requestId,
    changedByUserId,
    description,
    raisedAt: new Date().toISOString(),
    status: 'Pending'
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

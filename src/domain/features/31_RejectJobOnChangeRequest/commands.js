// src/domain/features/25_RejectChangeRequest/commands.js

export const RejectChangeRequestCommand = (changeRequestId, changedByUserId, reason) => ({
  type: 'RejectChangeRequestCommand',
  changeRequestId,
  changedByUserId,
  reason
});

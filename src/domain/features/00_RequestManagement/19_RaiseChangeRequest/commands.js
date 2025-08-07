export function RaiseChangeRequestCommand(requestId, changedByUserId, description, changeRequestId) {
  return {
    type: 'RaiseChangeRequest',
    requestId,
    changedByUserId,
    description,
    changeRequestId,
  };
}
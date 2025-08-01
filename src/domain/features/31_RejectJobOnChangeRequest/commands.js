// Stub for RejectChangeRequestCommand
export const RejectChangeRequestCommand = (changeRequestId, requestId, userId, reason) => {
  return {
    data: {
      changeRequestId: changeRequestId || 'default-change-request-id',
      requestId: requestId || 'default-request-id',
      userId: userId || 'default-user-id',
      reason: reason || 'default reason'
    }
  };
};

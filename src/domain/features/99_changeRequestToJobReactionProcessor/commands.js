
export const RejectChangeRequestAssignmentCommand = (changeRequestId, requestId, userId, reason) => ({
  data: {
    changeRequestId,
    requestId,
    userId,
    reason
  }
});


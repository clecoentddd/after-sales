export const ChangeRequestJobAssignmentFailed = (requestId, changeRequestId, reason) => ({
  type: 'ChangeRequestJobAssignmentFailed',
  aggregateType: "ChangeRequest",
  aggregateId: requestId,
  changeRequestId,
  data: { reason },
  timestamp: new Date().toISOString(),
  eventId: crypto.randomUUID(),
});
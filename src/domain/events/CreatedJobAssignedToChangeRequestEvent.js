export const CreatedJobAssignedToChangeRequestEvent = (jobId, requestId, changeRequestId) => ({
  type: 'CreatedJobAssignedToChangeRequest',
  aggregateType: 'Projection',
  aggregateId: jobId,   // tie to the CR
  requestId: requestId,
  changeRequestId: changeRequestId,
  metadata: { timestamp: new Date().toISOString() },
});
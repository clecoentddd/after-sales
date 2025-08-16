// Event constructors
export const ChangeRequestJobAssignedEvent = (jobId, requestId, changeRequestId) => ({
  type: 'ChangeRequestJobAssigned',
  aggregateType: "Job",
  aggregateId: jobId,
  data: { 
      requestId: requestId,
      changeRequestId: changeRequestId,
  },
  timestamp: new Date().toISOString(),
});

// Event constructors
export const ChangeRequestJobAssigned = (jobId, requestId, changeRequestId) => ({
  type: 'ChangeRequestJobAssigned',
  aggregateType: "Job",
  aggregateId: jobId,
  data: { 
      requestId: requestId,
      changeRequestId: changeRequestId,
  },
  timestamp: new Date().toISOString(),
  eventId: crypto.randomUUID(),
});

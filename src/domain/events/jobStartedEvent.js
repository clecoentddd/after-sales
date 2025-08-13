export const JobStartedEvent = (jobId, requestId, changeRequestId, assignedTeam, startedByUserId) => {
  const timestamp = new Date().toISOString();
  return {
    type: 'JobStarted',
    aggregateId: jobId,
    aggregateType: 'Job',
    requestId: requestId,
    changeRequestId: changeRequestId,
    data: {
      assignedTeam,
      startedByUserId,
      startedAt: timestamp,
      status: 'Started', // Include status to track the state transition
    },
    metadata: {
      timestamp,
    },
  };
};
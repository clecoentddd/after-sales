export const JobStartedEvent = (jobId, assignedTeam, startedByUserId) => {
  const timestamp = new Date().toISOString();
  return {
    type: 'JobStarted',
    aggregateId: jobId,
    aggregateType: 'Job',
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
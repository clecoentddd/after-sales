export const JobStartedEvent = (jobId, requestId, assignedTeam, startedByUserId) => {
  const timestamp = new Date().toISOString();

  return {
    type: 'JobStarted',
    aggregateId: jobId,
    aggregateType: 'Job',
    data: {
      requestId,
      assignedTeam,
      startedByUserId,
      startedAt: timestamp,
      status: 'Started',
    },
    metadata: {
      timestamp
    }
  };
};

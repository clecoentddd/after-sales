export const JobStartedEvent = (jobId, requestId, assignedTeam, startedByUserId) => {
  const timestamp = new Date().toISOString();

  return {
    type: 'JobStarted',
    data: {
      jobId,
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

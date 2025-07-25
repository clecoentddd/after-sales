// src/domain/features/startJob/events.js
// Defines the JobStartedEvent.

/**
 * Factory function for creating a JobStartedEvent.
 * This event signifies that a specific repair job has been started and assigned.
 * @param {string} jobId - The ID of the job that was started.
 * @param {string} assignedTeam - The team that the job was assigned to.
 * @param {string} startedByUserId - The ID of the user who initiated the job start.
 * @returns {object} The JobStartedEvent object.
 */
export const JobStartedEvent = (jobId, assignedTeam, startedByUserId) => ({
  type: 'JobStarted', // Event type identifier
  data: {
    jobId,
    assignedTeam,
    startedByUserId,
    startedAt: new Date().toISOString(), // Timestamp of when the job was started
    status: 'Started', // Initial status of the job
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

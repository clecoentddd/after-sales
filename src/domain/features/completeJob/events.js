// completeJob/events.js
// Defines the JobCompletedEvent.

/**
 * Factory function for creating a JobCompletedEvent.
 * This event signifies that a specific repair job has been successfully completed.
 * @param {string} jobId - The ID of the job that was completed.
 * @param {string} completedByUserId - The ID of the user who completed the job.
 * @param {object} completionDetails - Details about the job completion.
 * @returns {object} The JobCompletedEvent object.
 */
export const JobCompletedEvent = (jobId, completedByUserId, completionDetails) => ({
  type: 'JobCompleted', // Event type identifier
  data: {
    jobId,
    completedByUserId,
    completedAt: new Date().toISOString(), // Timestamp of when the job was completed
    completionDetails
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

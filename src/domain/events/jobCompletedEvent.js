// src/domain/events/jobCompletedEvent.js
// Defines the JobCompletedEvent.

/**
 * Factory function for creating a JobCompletedEvent.
 * This event signifies that a specific repair job has been completed.
 * @param {string} jobId - The ID of the job that was completed.
 * @param {string} requestId - The ID of the original request associated with the job.
 * @param {string} completedByUserId - The ID of the user who marked the job as complete.
 * @param {object} completionDetails - Optional details about the job completion.
 * @returns {object} The JobCompletedEvent object.
 */
export const JobCompletedEvent = (jobId, requestId, completedByUserId, completionDetails = {}) => ({
  type: 'JobCompleted',
  data: {
    jobId,
    requestId, // Now correctly using the function parameter
    completedByUserId,
    completionDetails,
    completedAt: new Date().toISOString(),
    status: 'Completed',
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

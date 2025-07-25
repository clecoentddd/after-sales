// completeJob/commands.js
// Defines commands related to completing a repair job.

/**
 * Factory function for creating a CompleteJobCommand.
 * This command is used to initiate the completion of a specific repair job.
 * @param {string} jobId - The ID of the job to complete.
 * @param {string} completedByUserId - The ID of the user who marked the job as complete.
 * @param {object} completionDetails - Optional details about the job completion (e.g., notes, final checks).
 * @returns {object} The CompleteJobCommand object.
 */
export const CompleteJobCommand = (jobId, completedByUserId, completionDetails = {}) => ({
  type: 'CompleteJob', // Command type identifier
  jobId,
  completedByUserId,
  completionDetails,
});

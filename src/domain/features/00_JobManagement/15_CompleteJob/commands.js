// src/domain/features/15_CompleteJob/commands.js

/**
 * Creates a CompleteJobCommand object with validation.
 *
 * @param {string} jobId - The ID of the job to complete.
 * @param {string} completedByUserId - The ID of the user completing the job.
 * @param {object} completionDetails - Optional metadata (e.g., notes, duration).
 * @returns {object} A well-structured command object.
 * @throws {Error} If required fields are missing.
 */
export const CompleteJobCommand = (jobId, requestId, completedByUserId, completionDetails = {}) => {
  if (!jobId || !completedByUserId) {
    throw new Error('CompleteJobCommand requires jobId and completedByUserId.');
  }

  return {
    type: 'CompleteJob',
    jobId,
    requestId,
    completedBy: completedByUserId,
    completionDetails
  };
};

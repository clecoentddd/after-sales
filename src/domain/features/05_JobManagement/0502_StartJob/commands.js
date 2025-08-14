// startJob/commands.js
// Defines commands related to starting a repair job.

/**
 * Factory function for creating a StartJobCommand.
 * This command is used to initiate the starting of a job, assigning it to a team.
 * @param {string} jobId - The ID of the job to start.
 * @param {string} assignedTeam - The team assigned to the job.
 * @param {string} startedByUserId - The ID of the user who started the job.
 * @returns {object} The StartJobCommand object.
 */
export const StartJobCommand = (jobId, assignedTeam, startedByUserId) => ({
  type: 'StartJob', // Command type identifier
  jobId,
  assignedTeam,
  startedByUserId,
});

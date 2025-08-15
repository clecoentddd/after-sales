// src/domain/features/onHoldJob/commands.js
// Defines commands related to putting a job on hold.

/**
 * Factory function for creating a PutJobOnHoldCommand.
 * This command is used to change the status of a pending job to "OnHold".
 * @param {string} jobId - The ID of the job to put on hold.
 * @param {string} heldByUserId - The ID of the user who put the job on hold.
 * @param {string} reason - The reason for putting the job on hold.
 * @returns {object} The PutJobOnHoldCommand object.
 */
export const PutJobOnHoldCommand = (jobId, heldByUserId, reason, changeRequestId) => ({
  type: 'PutJobOnHold',
  jobId,
  heldByUserId,
  reason,
  changeRequestId,  // new optional parameter
});

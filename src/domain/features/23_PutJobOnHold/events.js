// src/domain/features/onHoldJob/events.js
// Defines the JobOnHoldEvent.

/**
 * Factory function for creating a JobOnHoldEvent.
 * This event signifies that a specific job has been put on hold.
 * @param {string} jobId - The ID of the job that was put on hold.
 * @param {string} heldByUserId - The ID of the user who put the job on hold.
 * @param {string} reason - The reason for holding the job.
 * @returns {object} The JobOnHoldEvent object.
 */
export const JobOnHoldEvent = (jobId, heldByUserId, reason) => ({
  type: 'JobOnHold', // Event type identifier
  data: {
    jobId,
    heldByUserId,
    reason,
    onHoldAt: new Date().toISOString(), // Timestamp of when the job was put on hold
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

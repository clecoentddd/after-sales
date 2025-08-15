// src\domain\events\jobOnHoldEvent.js

/**
 * Factory function for creating a JobOnHoldEvent.
 * This event indicates a job was put on hold.
 * 
 * @param {string} jobId - The ID of the job to put on hold.
 * @param {string} requestId - The related request ID.
 * @param {string} putOnHoldBy - User ID who put the job on hold.
 * @param {string} reason - Reason why the job was put on hold.
 * @returns {object} The JobOnHoldEvent object.
 */
export const JobOnHoldEvent = (jobId, requestId, changeRequestId, putOnHoldBy, reason) => ({
  type: 'JobOnHold',
  aggregateType: "Job",
  aggregateId: jobId,
  requestId,
  changeRequestId,
  data: {
    putOnHoldBy,
    reason,
    onHoldAt: new Date().toISOString(),
    CRstatus: 'OnHold'
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

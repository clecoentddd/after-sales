// repair/events.js
// Defines events related to the Repair Job domain.

/**
 * Factory function for creating a JobCreatedEvent.
 * This event signifies that a new repair job has been initiated.
 * @param {string} jobId - Unique ID of the created job.
 * @param {string} customerId - The ID of the customer for this job.
 * @param {string} requestId - The ID of the original request linked to this job.
 * @param {string} quotationId - The ID of the approved quotation linked to this job.
 * @param {object} jobDetails - Details about the repair job (e.g., description, type, assigned team).
 * @param {string} status - The initial status of the job (e.g., 'Pending', 'Scheduled').
 * @returns {object} The JobCreatedEvent object.
 */
export const JobCreatedEvent = (jobId, customerId, requestId, quotationId, jobDetails, status = 'Pending') => ({
  type: 'JobCreated', // Event type identifier
  data: {
    jobId,
    customerId,
    requestId,
    quotationId,
    jobDetails,
    status
  },
  metadata: {
    timestamp: new Date().toISOString() // Timestamp of when the event occurred
  }
});

// Future events could include:
// JobScheduledEvent
// JobStartedEvent
// JobCompletedEvent
// JobStatusChangedEvent

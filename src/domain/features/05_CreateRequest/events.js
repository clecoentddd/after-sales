// request/events.js
// Defines events related to the Request domain.

/**
 * Factory function for creating a RequestCreatedEvent.
 * This event signifies that a new request has been successfully created.
 * @param {string} requestId - Unique ID of the created request.
 * @param {string} customerId - The ID of the customer associated with this request.
 * @param {object} requestDetails - The details of the request.
 * @param {string} status - The initial status of the request (e.g., 'Pending', 'New').
 * @returns {object} The RequestCreatedEvent object.
 */
export const RequestCreatedEvent = (requestId, customerId, requestDetails, status = 'Pending') => ({
  type: 'RequestCreated', // Event type identifier
  data: {
    requestId,
    customerId,
    requestDetails,
    status
  },
  metadata: {
    timestamp: new Date().toISOString() // Timestamp of when the event occurred
  }
});
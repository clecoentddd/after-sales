// approval/events.js
// Defines events related to the Quote Approval domain.

/**
 * Factory function for creating a QuoteApprovedEvent.
 * This event signifies that a specific quotation has been approved.
 * @param {string} quoteId - The ID of the quotation that was approved.
 * @param {string} approvedByUserId - The ID of the user who approved the quotation.
 * @returns {object} The QuoteApprovedEvent object.
 */
export const QuoteApprovedEvent = (quoteId, requestId, approvedByUserId) => ({
  type: 'QuoteApproved', // Event type identifier
  data: {
    quoteId,
    requestId,
    approvedByUserId,
  },
  metadata: {
    timestamp: new Date().toISOString() // Timestamp of when the event occurred
  }
});

// Future events could include:
// QuoteRejectedEvent
// QuoteApprovalRevokedEvent

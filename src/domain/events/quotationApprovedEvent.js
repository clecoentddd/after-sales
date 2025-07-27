// approval/events.js
// Defines events related to the Quotation Approval domain.

/**
 * Factory function for creating a QuotationApprovedEvent.
 * This event signifies that a specific quotation has been approved.
 * @param {string} quotationId - The ID of the quotation that was approved.
 * @param {string} approvedByUserId - The ID of the user who approved the quotation.
 * @returns {object} The QuotationApprovedEvent object.
 */
export const QuotationApprovedEvent = (quotationId, requestId, approvedByUserId) => ({
  type: 'QuotationApproved', // Event type identifier
  data: {
    quotationId,
    requestId,
    approvedByUserId,
  },
  metadata: {
    timestamp: new Date().toISOString() // Timestamp of when the event occurred
  }
});

// Future events could include:
// QuotationRejectedEvent
// QuotationApprovalRevokedEvent

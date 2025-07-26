// src/domain/features/onHoldQuotation/events.js
// Defines the QuotationOnHoldEvent.

/**
 * Factory function for creating a QuotationOnHoldEvent.
 * This event signifies that a specific quotation has been put on hold.
 * @param {string} quoteId - The ID of the quotation that was put on hold.
 * @param {string} requestId - The ID of the request related to the quotation.
 * @param {string} changeRequestId - The ID of the change request, if any, that caused the hold.
 * @param {string} heldByUserId - The ID of the user who put the quotation on hold.
 * @param {string} reason - The reason for holding the quotation.
 * @returns {object} The QuotationOnHoldEvent object.
 */
export const QuotationOnHoldEvent = (quoteId, requestId, changeRequestId, heldByUserId, reason) => ({
  type: 'QuotationOnHold', // Event type identifier
  data: {
    quoteId,
    requestId,
    changeRequestId,
    heldByUserId,
    reason,
    onHoldAt: new Date().toISOString(), // Timestamp of when the quotation was put on hold
    status: 'On Hold' // Explicitly set status in the event data
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

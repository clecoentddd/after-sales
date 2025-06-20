// src/domain/features/onHoldQuotation/events.js
// Defines the QuotationOnHoldEvent.

/**
 * Factory function for creating a QuotationOnHoldEvent.
 * This event signifies that a specific quotation has been put on hold.
 * @param {string} quotationId - The ID of the quotation that was put on hold.
 * @param {string} heldByUserId - The ID of the user (or system) who put the quotation on hold.
 * @param {string} reason - The reason for holding the quotation.
 * @returns {object} The QuotationOnHoldEvent object.
 */
export const QuotationOnHoldEvent = (quotationId, heldByUserId, reason) => ({
  type: 'QuotationOnHold', // Event type identifier
  data: {
    quotationId,
    heldByUserId,
    reason,
    onHoldAt: new Date().toISOString(), // Timestamp of when the quotation was put on hold
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

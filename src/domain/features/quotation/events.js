// quotation/events.js
// Defines events related to the Quotation domain.

/**
 * Factory function for creating a QuotationCreatedEvent.
 * This event signifies that a new quotation has been generated.
 * @param {string} quotationId - Unique ID of the created quotation.
 * @param {string} requestId - The ID of the request for which the quotation was created.
 * @param {string} customerId - The ID of the customer associated with this quotation.
 * @param {object} quotationDetails - Details about the quotation (e.g., amount, items, expiry date).
 * @param {string} status - The initial status of the quotation (e.g., 'Draft', 'Pending').
 * @returns {object} The QuotationCreatedEvent object.
 */
export const QuotationCreatedEvent = (quotationId, requestId, customerId, quotationDetails, status = 'Draft') => ({
  type: 'QuotationCreated', // Event type identifier
  data: {
    quotationId,
    requestId,
    customerId,
    quotationDetails,
    status
  },
  metadata: {
    timestamp: new Date().toISOString() // Timestamp of when the event occurred
  }
});

// Future events could include:
// QuotationUpdatedEvent
// QuotationAcceptedEvent
// QuotationRejectedEvent

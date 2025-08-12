// @events/invoiceRejectedEvent.js
// Defines events related to rejected invoices.

/**
 * Factory function for creating an InvoiceRejectedEvent.
 * This event signifies that an invoice could not be created due to missing or invalid data.
 * @param {string} jobId - The ID of the job for which invoice creation was attempted.
 * @param {string} customerId - The ID of the customer.
 * @param {string} reason - The reason why the invoice was rejected.
 * @param {object} additionalData - Additional context about the rejection.
 * @returns {object} The InvoiceRejectedEvent object.
 */
export const InvoiceRejectedEvent = (aggregateId, jobId, reason) => ({
  type: 'InvoiceRejected', // Event type identifier
  aggregateId: aggregateId,
  aggregateType: "Invoice",
  data: {
    jobId,
    reason,
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});
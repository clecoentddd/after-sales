// invoicing/events.js
// Defines events related to the Invoicing domain.

/**
 * Factory function for creating an InvoiceCreatedEvent.
 * This event signifies that a new invoice has been generated.
 * @param {string} invoiceId - Unique ID of the created invoice.
 * @param {string} jobId - The ID of the job for which the invoice was created.
 * @param {string} quotationId - The ID of the quotation related to the invoice.
 * @param {string} customerId - The ID of the customer the invoice is for.
 * @param {number} amount - The total amount of the invoice.
 * @param {string} currency - The currency of the invoice amount.
 * @param {string} description - A description for the invoice.
 * @returns {object} The InvoiceCreatedEvent object.
 */
export const InvoiceCreatedEvent = (invoiceId, jobId, quotationId, customerId, amount, currency, description) => ({
  type: 'InvoiceCreated', // Event type identifier
  data: {
    invoiceId,
    jobId,
    quotationId,
    customerId,
    amount,
    currency,
    description,
    createdAt: new Date().toISOString(),
    status: 'Pending' // Initial status
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

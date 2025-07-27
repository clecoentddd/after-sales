
// invoicing/aggregate.js
// Defines the InvoiceAggregate, responsible for creating Invoice-related events.

import { v4 as uuidv4 } from 'uuid';
import { InvoiceCreatedEvent } from './events';

export class InvoiceAggregate {
  /**
   * Static method to create a new invoice, emitting an InvoiceCreatedEvent.
   * This is typically triggered by a JobCompletedEvent.
   * @param {string} jobId - The ID of the job related to this invoice.
   * @param {string} quotationId - The ID of the quotation related to this invoice.
   * @param {string} customerId - The ID of the customer.
   * @param {number} amount - The amount for the invoice.
   * @param {string} currency - The currency.
   * @param {string} description - Description for the invoice.
   * @returns {object} An InvoiceCreatedEvent.
   */
  static createInvoice(jobId, quotationId, customerId, amount, currency, description) {
    console.log(`[InvoiceAggregate] Creating invoice for job ${jobId}`);
    return InvoiceCreatedEvent(
      uuidv4(), // Generate a unique ID for the new invoice
      jobId,
      quotationId,
      customerId,
      amount,
      currency,
      description
    );
  }
}

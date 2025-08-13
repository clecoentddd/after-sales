
// invoicing/aggregate.js
// Defines the InvoiceAggregate, responsible for creating Invoice-related events.

import { v4 as uuidv4 } from 'uuid';
import { InvoiceRaisedEvent } from '../../events/invoiceRaisedEvent';

export class InvoiceAggregate {

  static createInvoice(jobId, requestId, changeRequestId, quotationId, customerId, amount, currency, description) {
    console.log(`[InvoiceAggregate] Creating invoice for job ${jobId}`);
    return InvoiceRaisedEvent(
      uuidv4(), // Generate a unique ID for the new invoice
      requestId,
      changeRequestId,
      jobId,
      quotationId,
      customerId,
      amount,
      currency,
      description
    );
  }
}

// quotation/aggregate.js
// Defines the QuotationAggregate, responsible for creating Quotation-related events.

import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { QuotationCreatedEvent } from './events'; // Import the QuotationCreatedEvent

export class QuotationAggregate {
  /**
   * Static method to create a new quotation from a request, emitting a QuotationCreatedEvent.
   * This method acts as a factory for the QuotationCreatedEvent based on incoming data.
   * @param {string} requestId - The ID of the request that triggered this quotation.
   * @param {string} customerId - The ID of the customer for this quotation.
   * @param {object} requestDetails - Details from the original request.
   * @returns {object} A QuotationCreatedEvent.
   */
  static createFromRequest(requestId, customerId, requestDetails) {
    console.log(`[QuotationAggregate] Creating quotation from request: ${requestId}`);
    // Here you would typically add logic to determine quotation details based on requestDetails
    const quotationDetails = {
      title: `Quotation for: ${requestDetails.title}`,
      estimatedAmount: (Math.random() * 1000 + 500).toFixed(2), // Example: random amount
      currency: 'USD',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };

    return QuotationCreatedEvent(
      uuidv4(), // Generate a unique ID for the new quotation
      requestId,
      customerId,
      quotationDetails,
      'Draft' // Initial status for a new quotation
    );
  }
  // Future methods for updating or accepting quotations would go here.
}

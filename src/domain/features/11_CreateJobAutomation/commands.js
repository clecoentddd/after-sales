// src/domain/features/11_CreateJobAutomation/commands.js

export class CreateJobFromApprovedQuoteCommand {
  constructor({ customerId, requestId, quoteId, requestDetails }) {
    if (!customerId || !requestId || !quoteId || !requestDetails) {
      throw new Error('Missing required fields for CreateJobFromApprovedQuoteCommand');
    }

    this.type = 'CreateJobFromApprovedQuote';
    this.customerId = customerId;
    this.requestId = requestId;
    this.quoteId = quoteId;
    this.requestDetails = requestDetails;
  }
}

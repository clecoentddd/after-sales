// src/domain/features/11_CreateJobAutomation/commands.js

export class CreateJobFromApprovedQuotationCommand {
  constructor({ customerId, requestId, quotationId, requestDetails }) {
    if (!customerId || !requestId || !quotationId || !requestDetails) {
      throw new Error('Missing required fields for CreateJobFromApprovedQuotationCommand');
    }

    this.type = 'CreateJobFromApprovedQuotation';
    this.customerId = customerId;
    this.requestId = requestId;
    this.quotationId = quotationId;
    this.requestDetails = requestDetails;
  }
}

export class CreateJobFromApprovedQuotationCommand {
  constructor({ quotationId, requestId, changeRequestId, quotationDetails }) {
    this.type = 'CreateJobFromApprovedQuotation';

    // Validate required fields
    if (!quotationId || !requestId || !changeRequestId || !quotationDetails) {
      console.error('[CreateJobFromApprovedQuotationCommand] Missing required fields:', {
        quotationId,
        requestId,
        changeRequestId,
        quotationDetails,
      });
      throw new Error('Missing required fields for CreateJobFromApprovedQuotationCommand');
    }

    // Validate quotationDetails structure
    if (
      !quotationDetails.title ||
      !quotationDetails.operations ||
      !quotationDetails.currency ||
      quotationDetails.estimatedAmount === undefined
    ) {
      console.error('[CreateJobFromApprovedQuotationCommand] Invalid quotationDetails:', quotationDetails);
      throw new Error('Invalid quotationDetails: title, operations, currency, and estimatedAmount are required');
    }

    this.quotationId = quotationId;
    this.requestId = requestId;
    this.changeRequestId = changeRequestId;
    this.quotationDetails = quotationDetails;
  }
}

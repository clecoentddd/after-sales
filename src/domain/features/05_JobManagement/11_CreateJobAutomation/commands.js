export class CreateJobFromApprovedQuotationCommand {
  constructor({ quotationId, requestId, changeRequestId, quotationDetails }) {
    this.type = 'CreateJobFromApprovedQuotation';
    console.log('[CreateJobFromApprovedQuotationCommand] Constructor input:', {
      quotationId,
      requestId,
      changeRequestId,
      quotationDetails,
    });

    if (!quotationId || !requestId || !changeRequestId || !quotationDetails) {
      console.error('[CreateJobFromApprovedQuotationCommand] Missing fields:', {
        quotationId,
        requestId,
        changeRequestId,
        quotationDetails,
      });
      throw new Error('Missing required fields for CreateJobFromApprovedQuotationCommand');
    }

    this.quotationId = quotationId;
    this.requestId = requestId;
    this.changeRequestId = changeRequestId;
    this.quotationDetails = quotationDetails;
  }
}

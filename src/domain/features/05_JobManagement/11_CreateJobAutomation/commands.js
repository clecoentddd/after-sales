export class CreateJobFromApprovedQuotationCommand {
  constructor({ requestId, changeRequestId, quotationId, quotationDetails }) {
    this.type = 'CreateJobFromApprovedQuotation';
    console.log('[CreateJobFromApprovedQuotationCommand] Constructor input:', {
      requestId,
      changeRequestId,
      quotationId,
      quotationDetails,
    });

    if ( !requestId || !changeRequestId || !quotationId || !quotationDetails) {
      console.error('[CreateJobFromApprovedQuotationCommand] Missing fields:', {
        requestId,
        changeRequestId,
        quotationId,
        quotationDetails,
      });
      throw new Error('Missing required fields for CreateJobFromApprovedQuotationCommand');
    }

    this.requestId = requestId;
    this.changeRequestId = changeRequestId;
    this.quotationId = quotationId;
    this.quotationDetails = quotationDetails;
  }
}

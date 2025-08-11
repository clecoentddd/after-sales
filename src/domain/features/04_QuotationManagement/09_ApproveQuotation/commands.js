// Defines the ApproveQuotationCommand used to request approval of a quotation

export class ApproveQuotationCommand {
  /**
   * @param {Object} params
   * @param {string} params.quotationId - ID of the quotation to approve
   * @param {string} params.userId - ID of the user approving the quotation
   */
  constructor({ quotationId, userId }) {
    if (!quotationId || !userId) {
      throw new Error("ApproveQuotationCommand requires quotationId, requestId, and userId.");
    }

    this.type = 'ApproveQuotation';
    this.quotationId = quotationId;
    this.userId = userId;
  }
}

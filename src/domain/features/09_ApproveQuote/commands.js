// Defines the ApproveQuoteCommand used to request approval of a quotation

export class ApproveQuoteCommand {
  /**
   * @param {Object} params
   * @param {string} params.quoteId - ID of the quotation to approve
   * @param {string} params.userId - ID of the user approving the quote
   */
  constructor({ quoteId, userId }) {
    if (!quoteId || !userId) {
      throw new Error("ApproveQuoteCommand requires quoteId, requestId, and userId.");
    }

    this.type = 'ApproveQuote';
    this.quoteId = quoteId;
    this.userId = userId;
  }
}

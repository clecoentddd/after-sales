// approval/commands.js
// Defines commands related to the Quote Approval domain.

/**
 * Factory function for creating an ApproveQuoteCommand.
 * This command is used to initiate the approval of a specific quotation.
 * @param {string} quoteId - The ID of the quotation to approve.
 * @param {string} userId - The ID of the user initiating the approval.
 * @returns {object} The ApproveQuoteCommand object.
 */
export const ApproveQuoteCommand = (quoteId, userId) => ({
  type: 'ApproveQuote', // Command type identifier
  quoteId,    // The ID of the quote to be approved
  userId      // The ID of the user performing the approval
});

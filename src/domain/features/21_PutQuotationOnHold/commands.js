// src/domain/features/onHoldQuotation/commands.js
// Defines commands related to putting a quotation on hold.

/**
 * Factory function for creating a PutQuotationOnHoldCommand.
 * This command is used to change the status of a quotation to "OnHold".
 * @param {string} quoteId - The ID of the quotation to put on hold.
 * @param {string} heldByUserId - The ID of the user who put the quotation on hold.
 * @param {string} reason - The reason for putting the quotation on hold.
 * @returns {object} The PutQuotationOnHoldCommand object.
 */
export const PutQuotationOnHoldCommand = (quoteId, requestId, changeRequestId, heldByUserId, reason) => ({
  type: 'PutQuotationOnHold', // Command type identifier
  quoteId,
  requestId,
  changeRequestId,
  heldByUserId,
  reason,
});

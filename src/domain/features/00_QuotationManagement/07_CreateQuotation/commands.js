// quotation/commands.js

/**
 * Command to create a quotation from a request
 * @param {string} quotationId
 * @param {string} requestId
 * @param {string} customerId
 * @param {object} requestDetails
 */
export const CreateQuotationCommand = (quotationId, requestId, customerId, requestDetails) => ({
  type: 'CreateQuotation',
  quotationId,
  requestId,
  customerId,
  requestDetails
});

// request/commands.js
// Defines commands related to the Request domain.

/**
 * Factory function for creating a CreateRequestCommand.
 * This command is used to initiate the creation of a new request.
 * @param {string} customerId - The ID of the customer for whom the request is being created.
 * @param {object} requestDetails - An object containing details about the request (e.g., description, type).
 * @returns {object} The CreateRequestCommand object.
 */
export const CreateRequestCommand = (customerId, requestDetails) => ({
  type: 'CreateRequest', // Command type identifier
  customerId, // Customer ID associated with this request
  requestDetails // Details specific to the request
});

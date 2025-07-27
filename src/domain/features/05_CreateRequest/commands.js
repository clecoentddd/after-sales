export const CreateRequestCommand = (requestId, customerId, requestDetails) => ({
  type: 'CreateRequest', // Command type identifier
  requestId,
  customerId, // Customer ID associated with this request
  requestDetails // Details specific to the request
});

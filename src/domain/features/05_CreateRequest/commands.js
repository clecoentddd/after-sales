export const CreateRequestCommand = (customerId, requestDetails) => ({
  type: 'CreateRequest', // Command type identifier
  customerId, // Customer ID associated with this request
  requestDetails // Details specific to the request
});

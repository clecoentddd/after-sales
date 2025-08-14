export const RaiseRequestCommand = (
  requestId,
  changeRequestId,
  customerId,
  requestDetails,
  versionId = 1
) => ({
  type: 'RaiseRequest', // Command type identifier
  requestId,
  changeRequestId,
  customerId,
  requestDetails,
  versionId
});

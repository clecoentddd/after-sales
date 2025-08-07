export const RaiseRequestCommand = (
  requestId,
  customerId,
  requestDetails,
  changeRequestId = null,
  versionId = 1
) => ({
  type: 'RaiseRequest', // Command type identifier
  requestId,
  customerId,
  requestDetails,
  changeRequestId,
  versionId
});

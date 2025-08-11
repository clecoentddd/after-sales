export function CloseRequestCommand(requestId, changeRequestId) {
  console.log(`[CloseRequestCommand] Closing request with ID: ${requestId}, Change Request ID: ${changeRequestId}`);
  return {
    type: 'CloseRequest',
    requestId,
    changeRequestId
  };
}
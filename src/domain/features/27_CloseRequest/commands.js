export function CloseRequestCommand(requestId) {
  return {
    type: 'CloseRequest',
    requestId,
  };
}
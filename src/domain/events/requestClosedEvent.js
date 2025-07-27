export function RequestClosedEvent(requestId) {
  return {
    type: 'RequestClosed',
    data: { requestId },
    timestamp: new Date().toISOString(),
  };
}
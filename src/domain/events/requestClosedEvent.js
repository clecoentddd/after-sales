export function RequestClosedEvent(requestId) {
  return {
    type: 'RequestClosed',
    data: { requestId },
    metadata: {
    timestamp: new Date().toISOString(),
    },
  };
}
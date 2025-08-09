export function RequestClosedEvent(requestId) {
  return {
    type: 'RequestClosed',
    aggregateId: requestId,
    aggregateType: 'Request',
    data: { requestId },
    metadata: {
    timestamp: new Date().toISOString(),
    },
  };
}
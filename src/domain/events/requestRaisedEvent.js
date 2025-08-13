export function RequestRaisedEvent({ requestId, changeRequestId, versionId, customerId, requestDetails, status }) {
  return {
    type: 'RequestRaised',
    aggregateId: requestId,
    changeRequestId, // Could be null for the first version
    aggregateType: "Request",
    data: {
      versionId,       // Should be a number or string version identifier
      customerId,
      requestDetails,
      status,
    },
    metadata: {
    timestamp: new Date().toISOString(),
    },
  };
}
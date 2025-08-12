export function RequestRaisedEvent({ requestId, changeRequestId, versionId, customerId, requestDetails, status }) {
  return {
    type: 'RequestRaised',
    aggregateId: requestId,
    aggregateType: "Request",
    data: {
      changeRequestId, // Could be null for the first version
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
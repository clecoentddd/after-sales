export function RequestRaisedEvent({ requestId, changeRequestId, versionId, customerId, requestDetails, status }) {
  return {
    type: 'RequestRaised',
    data: {
      requestId,
      changeRequestId, // Could be null for the first version
      versionId,       // Should be a number or string version identifier
      customerId,
      requestDetails,
      status,
      timestamp: new Date().toISOString()
    }
  };
}
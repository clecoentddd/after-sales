/**
 * Insert a new request into the projection DB
 */
export const insertNewRequest = (existingRequests, newRequest) => {
  console.log('[insertNewRequest] Existing requests:', existingRequests);
  console.log('[insertNewRequest] Inserting:', newRequest);

  if (!newRequest?.requestId) {
    console.error('[insertNewRequest] Missing requestId, skipping insert.');
    return existingRequests;
  }

  // Avoid duplicates
  const alreadyExists = existingRequests.some(r => r.requestId === newRequest.requestId);
  if (alreadyExists) {
    console.warn(`[insertNewRequest] Request ${newRequest.requestId} already exists, skipping insert.`);
    return existingRequests;
  }

  return [...existingRequests, newRequest];
};

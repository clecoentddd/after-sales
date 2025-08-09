import { eventBus } from '@core/eventBus';
import { queryRequestsProjection, setRequests } from '../shared/requestProjectionDB';

let isClosedHandlerInitialized = false;

export const initializeRequestClosedHandler = () => {
  if (isClosedHandlerInitialized) return;

  eventBus.subscribe('RequestClosed', (event) => {
    console.log('[RequestClosedHandler] Event:', event);
    handleRequestClosed (event);
  });

  isClosedHandlerInitialized = true;
};


/**
 * Mark a request as closed in the projection DB
 */
export const handleRequestClosed = (event) => {
  // Log the entire event object for context
  console.log('[handleRequestClosed] Handling RequestClosed event with data:', event);

  // Log the aggregateId being processed
  const requestId = event.aggregateId;
  console.log(`[handleRequestClosed] Closing request with ID: ${requestId}...`);

  // Log the existing requests before processing
  const existingRequests = queryRequestsProjection();
  console.log('[handleRequestClosed] Existing requests before update:', existingRequests);

  // Process the requests to close the specified request
  const updatedRequests = existingRequests.map(r => {
    if (r.requestId === requestId) {
      console.log(`[handleRequestClosed] Found matching request ${requestId}. Updating status to Closed.`);
      return { ...r, status: 'Closed' };
    }
    return r;
  });

  // Log the updated requests after processing
  console.log('[handleRequestClosed] Updated requests after closing:', updatedRequests);
  
  setRequests(updatedRequests);
  
  return updatedRequests;
};


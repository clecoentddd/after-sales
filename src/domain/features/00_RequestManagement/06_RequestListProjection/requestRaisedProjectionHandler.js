import { eventBus } from '@core/eventBus';
import { insertNewRequest } from '../06_RequestListProjection/requestRaisedProjectionUtils';
import { queryRequestsProjection, setRequests } from '../shared/requestProjectionDB';

let isRaisedHandlerInitialized = false;

// Define the handler function
export const handleRequestRaised = (event) => {
  console.log('[RequestRaisedHandler] Event received:', event);

  if (!event.aggregateId || !event.data?.customerId) {
    console.error('[RequestRaisedHandler] Missing required fields.');
    return;
  }

  const newRequest = {
    requestId: event.aggregateId,
    customerId: event.data.customerId,
    changeRequestId: event.data.changeRequestId || null,
    title: event.data.requestDetails?.title || '',
    description: event.data.requestDetails?.description || '',
    status: event.data.status || 'Pending',
    timestamp: event.data.timestamp || new Date().toISOString(),
  };

  const currentRequests = queryRequestsProjection();
  const updatedRequests = insertNewRequest(currentRequests, newRequest);
  setRequests(updatedRequests);

  console.log('[RequestRaisedHandler] Request inserted:', newRequest);
};

// Initialize the event handler
export const initializeRequestRaisedHandler = () => {
  if (isRaisedHandlerInitialized) {
    console.log('[RequestRaisedHandler] Already initialized.');
    return;
  }

  // Subscribe to the event bus
  eventBus.subscribe('RequestRaised', handleRequestRaised);

  isRaisedHandlerInitialized = true;
  console.log('[RequestRaisedHandler] Subscribed to RequestRaised events.');
};

// initializeAssignJobToChangeRequestProcessor.js
import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore';
import { ChangeRequestJobAssignmentFailed } from '@events/changeRequestAssignementFailedEvent';
import { ChangeRequestJobAssigned } from '@domain/events/changeRequestJobAssignedEvent';

let isInitialized = false;

export const initializeAssignJobToChangeRequestProcessor = () => {
  console.log('[initializeAssignJobToChangeRequestProcessor] Function called. isInitialized:', isInitialized);

  if (isInitialized) {
    console.log('[initializeAssignJobToChangeRequestProcessor] Already initialized. Skipping.');
    return () => {}; // Return empty cleanup function
  }

  // Minimal subscriber for debugging
  const unsubscribe = eventBus.subscribe('ChangeRequestRaised', (event) => {
    console.log('[DEBUG] Minimal subscriber received --:', event); // <-- Debug log

    const requestId = event.aggregateId;
    const changeRequestId = event.changeRequestId;

    console.log("[DEBUG] Minimal subscriber received details: ",requestId);

    if (!requestId || !changeRequestId) {
      console.error('[initializeAssignJobToChangeRequestProcessor] Invalid event structure:', event);
      return;
    }

    const allJobEvents = jobEventStore.getEvents();
    const jobCreatedEvents = allJobEvents.filter((e) => e.type === 'JobCreated' && e.requestId === requestId);

    console.log ("[initializeAssignJobToChangeRequestProcessor] Jobs found : ", jobCreatedEvents.length);
 
    if (jobCreatedEvents.length === 0) {
      const failureEvent = ChangeRequestJobAssignmentFailed(
        requestId,
        changeRequestId,
        'No job found to assign the change request. Job does not exist'
      );
      console.warn('[initializeAssignJobToChangeRequestProcessor] No job found. Producing ChangeRequestJobAssignmentFailed:', failureEvent);
      jobEventStore.append(failureEvent);
      eventBus.publish('ChangeRequestJobAssignmentFailed', failureEvent);
      return;
    }

    const jobCreated = jobCreatedEvents[0];
    const jobId = jobCreated.aggregateId;
    const successEvent = ChangeRequestJobAssigned(jobId, requestId, changeRequestId);
    console.log('[initializeAssignJobToChangeRequestProcessor] Job found. Producing ChangeRequestJobAssigned:', successEvent);
    jobEventStore.append(successEvent);
    console.log ("[initializeAssignJobToChangeRequestProcessor] Publishing ChangeRequestJobAssigned");
    console.log('[DEBUG] EventBus in publisher module:', eventBus);
    eventBus.publish(successEvent);

  });

  isInitialized = true;
  console.log('[initializeAssignJobToChangeRequestProcessor] Subscribed to ChangeRequestRaised.');

  // Return cleanup function
  return () => {
    console.log('[initializeAssignJobToChangeRequestProcessor] Unsubscribing from ChangeRequestRaised...');
    unsubscribe();
    isInitialized = false;
  };
};

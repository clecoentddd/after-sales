import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore';
import { ChangeRequestJobAssignmentFailed } from '@events/changeRequestAssignementFailedEvent';
import { ChangeRequestJobAssignedEvent } from '@events/changeRequestJobAssignedEvent';
import { AllJobsProjection } from '../0502_JobCreatedProjection/ListOfJobsProjection';

let isInitialized = false;

export const initializeAssignJobToChangeRequestProcessor = () => {
  console.log('[initializeAssignJobToChangeRequestProcessor] init called. isInitialized:', isInitialized);

  if (isInitialized) {
    console.log('[initializeAssignJobToChangeRequestProcessor] Already initialized. Skipping.');
    return () => {};
  }

  const unsubscribe = eventBus.subscribe('ChangeRequestRaised', (event) => {
    console.log('[initializeAssignJobToChangeRequestProcessor] ChangeRequestRaised received:', event);

    const requestId = event.aggregateId;
    const changeRequestId = event.changeRequestId;

    console.log("[initializeAssignJobToChangeRequestProcessor] (1) changeRequestId to assign job to : ",changeRequestId );

    if (!requestId || !changeRequestId) {
      console.error('[initializeAssignJobToChangeRequestProcessor] Invalid event structure:', event);
      return;
    }

    const job = AllJobsProjection.queryAllJobsByRequestId(requestId);

    if (!job) {
      const failureEvent = ChangeRequestJobAssignmentFailed(
        requestId,
        changeRequestId,
        'No job found to assign the change request. Job does not exist'
      );
      console.warn('[initializeAssignJobToChangeRequestProcessor] No job found → emitting failure event');
      jobEventStore.append(failureEvent);
      eventBus.publish('ChangeRequestJobAssignmentFailed', failureEvent);

      // optional: trigger background rebuild/retry
      // AllJobsProjection.rebuild().catch(err => console.error('Projection rebuild failed:', err));
      return;
    }

    console.log("[initializeAssignJobToChangeRequestProcessor] (2) changeRequestId to assign job to : ", job );
    const successEvent = ChangeRequestJobAssignedEvent(job.jobId, requestId, changeRequestId);
    console.log('[initializeAssignJobToChangeRequestProcessor] Job found → emitting success event', successEvent);
    jobEventStore.append(successEvent);
    eventBus.publish(successEvent);
  });

  isInitialized = true;
  console.log('[initializeAssignJobToChangeRequestProcessor] Subscribed to ChangeRequestRaised.');

  return () => {
    console.log('[initializeAssignJobToChangeRequestProcessor] Unsubscribing from ChangeRequestRaised...');
    unsubscribe();
    isInitialized = false;
  };
};

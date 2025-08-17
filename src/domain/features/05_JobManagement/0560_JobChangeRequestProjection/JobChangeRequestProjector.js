import { eventBus } from '@core/eventBus';
import { jobChangeRequestProjection } from './JobChangeRequestProjection';
import { CreatedJobAssignedToChangeRequestEvent } from '../../../events/createdJobAssignedToChangeRequestEvent';

export const initializeJobChangeRequestProjector = () => {
  console.log('[Projector] Initializing JobChangeRequestProjector');

  eventBus.subscribe('JobCreated', (event) => {
    console.log('[Projector] Received JobCreated event:', event);

    jobChangeRequestProjection.insert({
      requestId: event.requestId,
      jobId: event.aggregateId,
      changeRequestId: event.changeRequestId,
      type: 'Request',
      todo: 'Done',
    });
  });

  eventBus.subscribe('ChangeRequestRaised', (event) => {
    console.log('[Projector] Received ChangeRequestRaised event:', event);

    const requestRow = jobChangeRequestProjection.findByRequestId(event.aggregateId);
    if (!requestRow) {
      console.warn('[Projector] No Request row found for requestId:', event.aggregateId);
      return;
    }

    const newRow = {
      requestId: event.aggregateId,
      jobId: requestRow.jobId,
      changeRequestId: event.changeRequestId,
      type: 'ChangeRequest',
      todo: 'ToDo',
    };

    // Insert into projection with todo=true
    jobChangeRequestProjection.insert(newRow);

    // Publish synthetic event
    eventBus.publish(
      CreatedJobAssignedToChangeRequestEvent(
        newRow.jobId,
        newRow.requestId,
        newRow.changeRequestId
      )
    );
  });
};

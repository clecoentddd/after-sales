import { eventBus } from '@core/eventBus';
import { jobChangeRequestProjection } from './JobChangeRequestProjection';
import { CreatedJobAssignedToChangeRequestEvent} from '../../../events/createdJobAssignedToChangeRequestEvent'

export const initializeJobChangeRequestProjector = () => {
  console.log('[Projector] Initializing JobChangeRequestProjector');

  eventBus.subscribe('ChangeRequestRaised', (event) => {
    console.log('[Projector] Received ChangeRequestRaised event:', event);

    // Insert row with jobId null initially
    jobChangeRequestProjection.insert({
      changeRequestId: event.changeRequestId,
      requestId: event.aggregateId,
      jobId: null
    });
  });

  eventBus.subscribe('JobCreated', (event) => {
    console.log('[Projector] Received JobCreated event:', event);

    // Update row if a matching changeRequestId exists
    jobChangeRequestProjection.update(event.changeRequestId, event.aggregateId);

    // Projector's responsability:
    // Emit synthetic event only once when jobId becomes known
       eventBus.publish(CreatedJobAssignedToChangeRequestEvent(
         event.aggregateId,
         event.requestId,
         event.changeRequestId
      ));
  });
};
import { ChangeRequestDecisionTreeProjection } from './projection';
import { getAllEvents } from '../../core/eventStoreUtils';

export function rebuildProjection() {
  ChangeRequestDecisionTreeProjection.reset();

  const allEvents = getAllEvents();

  allEvents.forEach(event => {
    ChangeRequestDecisionTreeProjection.handleEvent(event);
  });

  console.log('[rebuildProjection] Projection rebuilt from events');
}

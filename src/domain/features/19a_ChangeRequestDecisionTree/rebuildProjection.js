import { ChangeRequestDecisionTreeProjection } from './projection';
import { getEventsFromStores } from '../../core/eventStoreUtils';
import {requestEventStore, jobEventStore, quotationEventStore} from '../../core/eventStore';

export function rebuildProjection() {
  ChangeRequestDecisionTreeProjection.reset();

  const allEvents = getEventsFromStores([requestEventStore, jobEventStore, quotationEventStore]);

  allEvents.forEach(event => {
    ChangeRequestDecisionTreeProjection.handleEvent(event);
  });

  console.log('[rebuildProjection] Projection rebuilt from events');
}

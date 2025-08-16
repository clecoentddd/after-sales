import { ChangeRequestDecisionTreeProjection } from './projection';
import { getEventsFromStores } from '@core/eventStoreUtils';
import {requestEventStore, jobEventStore, quotationEventStore} from '@core/eventStore';

export function rebuildProjection() {
  console.log('[rebuildProjection] Starting projection rebuild');

  const allEvents = getEventsFromStores([
    requestEventStore,
    jobEventStore,
    quotationEventStore
  ]);

  console.log(`[rebuildProjection] Loaded ${allEvents.length} events from stores`);

  // Use rebuild to reset + process events + notify subscribers
  ChangeRequestDecisionTreeProjection.rebuild(allEvents);

  // Immediately read back the data for logging / debugging
  const currentData = ChangeRequestDecisionTreeProjection.getAll();
  console.log('[rebuildProjection] Projection state after rebuild:', currentData);

  return currentData; // <--- return data if needed
}

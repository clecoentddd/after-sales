// src/domain/features/03_RequestManagement/shared/rebuildRequestProjection.js

import { requestEventStore } from '@core/eventStore';
import { clearRequests } from './requestProjectionDB';
import { handleRequestRaised } from '../06_RequestListProjection/requestRaisedProjectionHandler';
import { handleRequestClosed } from '../28_ProjectionClosedRequest/requestClosedProjectionHandler';
import { queryRequestsProjection } from './requestProjectionDB';

export async function rebuildRequestProjection() {
  console.log('[rebuildRequestProjection] Clearing projection DB...');
  clearRequests();

  console.log('[rebuildRequestProjection] Rebuilding from event store...');
  const allEvents = requestEventStore.getEvents();

  for (const event of allEvents) {
    console.log('[rebuildRequestProjection] Processing event:', event);
    if (event.type === 'RequestRaised') {
      handleRequestRaised(event);
    } else if (event.type === 'RequestClosed') {
      handleRequestClosed(event);
    }
  }

  console.log('[rebuildRequestProjection] Rebuild complete.');

  return queryRequestsProjection();
}


import { eventBus } from '@core/eventBus';
import { CreatedJobAssignedToChangeRequestEvent } from '../../../events/createdJobAssignedToChangeRequestEvent';

const rows = [];

export const jobChangeRequestProjection = {
  clear: () => rows.splice(0, rows.length),
  insert: (row) => {
  const exists = rows.some(r => r.changeRequestId === row.changeRequestId);
  if (exists) {
    console.log('[Projection] Row already exists, ignoring:', row.changeRequestId);
    return;
  }
  console.log('[Projection] Inserting row:', row);
  rows.push(row);
},
  update: (changeRequestId, jobId) => {
    const row = rows.find(r => r.changeRequestId === changeRequestId);
    if (row) {
      row.jobId = jobId;
      console.log('[Projection] Updated row:', row);
    } else {
      console.warn('[Projection] No row found for changeRequestId:', changeRequestId);
    }
  },
  getAll: () => [...rows],
};

// features/RepairJob/rebuildProjection.js
import { eventBus } from '@core/eventBus';

const repairJobState = {};
const listeners = new Set();

export const RepairJobProjection = {
  getEvents() {
    return Object.values(repairJobState);
  },

  subscribe(callback) {
    listeners.add(callback);
    callback(this.getEvents());
    return () => listeners.delete(callback);
  },

  notify() {
    const allData = this.getEvents();
    listeners.forEach(cb => cb(allData));
  },

  reset() {
    for (const key in repairJobState) {
      delete repairJobState[key];
    }
    this.notify();
  },

  handleEvent(event) {
    const jobId = event.aggregateId;
    if (!jobId) return;

    switch (event.type) {
      case 'JobCreated':
        if (!repairJobState[jobId]) {
          repairJobState[jobId] = {
            jobId,
            status: 'Pending',
            ...event.data,
          };
        }
        break;
      case 'JobStarted':
        if (repairJobState[jobId]) {
          repairJobState[jobId].status = 'Started';
        }
        break;
      case 'JobCompleted':
        if (repairJobState[jobId]) {
          repairJobState[jobId].status = 'Completed';
        }
        break;
      default:
        // ignore all other events
        return;
    }

    this.notify();
  },

  async rebuild(events) {
    this.reset();
    events.forEach(event => this.handleEvent(event));
    console.log('[RepairJobProjection] Rebuild complete');
  },
};

// 👇 Subscribe only to the relevant events
['JobCreated', 'JobStarted', 'JobCompleted'].forEach(type => {
  eventBus.subscribe(event => {
    if (event.type === type) RepairJobProjection.handleEvent(event);
  });
});

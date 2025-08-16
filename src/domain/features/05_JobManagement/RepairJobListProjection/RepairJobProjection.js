// RepairJobProjection.js
import { jobEventStore } from '@core/eventStore';

const repairJobState = {};
const listeners = new Set();

const RepairJobProjection = {
  getAll() {
    return Object.values(repairJobState);
  },

  subscribe(callback) {
    listeners.add(callback);
    callback(this.getAll());
    return () => listeners.delete(callback);
  },

  notify() {
    listeners.forEach(cb => {
      try {
        cb(this.getAll());
      } catch (err) {
        console.error('[RepairJobProjection] Subscriber callback error:', err);
      }
    });
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
          repairJobState[jobId] = { jobId, status: 'Pending', ...event.data };
        }
        break;
      case 'JobStarted':
        if (repairJobState[jobId]) repairJobState[jobId].status = 'Started';
        break;
      case 'JobCompleted':
        if (repairJobState[jobId]) repairJobState[jobId].status = 'Completed';
        break;
    }

    this.notify();
  },

  async rebuild() {
    const events = jobEventStore.getEvents();
    this.reset();
    events.forEach(event => this.handleEvent(event));
    console.log('[RepairJobProjection] Rebuild complete from events');
  }
};

export { RepairJobProjection };

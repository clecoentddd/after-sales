// features/RepairJob/rebuildProjection.js
import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore'; // Make sure this is imported

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
    console.log(" event being processed : ", event)
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
        console.log(" Job ID Event processed is : ", repairJobState[jobId]);
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

  async rebuild() { // No parameters needed
    try {
      const events =  jobEventStore.getEvents(); // Fetch events internally
      if (!Array.isArray(events)) {
        throw new Error('Expected an array of events from getEvents()');
      }
      this.reset();
      events.forEach(event => this.handleEvent(event));
      console.log('[RepairJobProjection] Rebuild complete', repairJobState);
    } catch (err) {
      console.error('[RepairJobProjection] Rebuild failed:', err);
      throw err; // Re-throw to let the caller handle it
    }
  },
};

// Subscribe only to the relevant events
['JobCreated', 'JobStarted', 'JobCompleted'].forEach(type => {
  eventBus.subscribe(event => {
    if (event.type === type) RepairJobProjection.handleEvent(event);
  });
});

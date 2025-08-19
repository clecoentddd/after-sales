import { jobEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

function createProjection() {
  const state = {};
  const listeners = new Set();

  const projection = {
    getAll() {
      return Object.values(state);
    },

    subscribe(callback) {
      listeners.add(callback);
      callback([...projection.getAll()]);
      return () => listeners.delete(callback);
    },

    notify() {
      console.log('[JobCreatedProjection] Notifying subscribers. Current state:', state);
      listeners.forEach(cb => {
        try {
          cb([...projection.getAll()]);
        } catch (err) {
          console.error('[JobCreatedProjection] Subscriber callback error:', err);
        }
      });
    },

    reset() {
      for (const key in state) delete state[key];
    },

handleEvent(event, { notify = true } = {}) {
  const jobId = event.aggregateId;
  if (!jobId) return;

  switch (event.type) {
    case 'JobCreated':
       state[jobId] = { 
            jobId, 
            requestId: event.requestId,     // <- include this
            changeRequestId: event.changeRequestId, // optional if needed
            ...event.data 
        };
      break;
    case 'JobStarted':
    case 'JobCompleted':
      delete state[jobId];
      break;
  }
  if (notify) projection.notify();
}
,

async rebuild() {
  console.log('[JobCreatedProjection] Rebuilding projection from store...');

  const events = await jobEventStore.getEvents();
  console.log(`[JobCreatedProjection] Retrieved ${events.length} events from store`);

  // 1️⃣ Clear state and notify subscribers immediately
  for (const key in state) delete state[key];
  projection.notify(); // UI sees empty state

  // 2️⃣ Wait 0.5s before replaying events
  setTimeout(() => {
    // Replay events without notifying each time
    events.forEach(e => this.handleEvent(e, { notify: false }));

    // Notify once after all events
    projection.notify();

    console.log('[JobCreatedProjection] Rebuild complete. State:', state);
  }, 500); // 500ms delay
},



    queryCreatedJobsList(requestId) {
      const job = Object.values(state).find(j => j.requestId === requestId);
      return job ? job.jobId : null;
    }
  };

  // --- AUTO-SUBSCRIBE to eventBus ---
  eventBus.subscribe('JobCreated', (event) => projection.handleEvent(event));
  eventBus.subscribe('JobStarted', (event) => projection.handleEvent(event));
  eventBus.subscribe('JobCompleted', (event) => projection.handleEvent(event));

  return projection;
}

export const JobCreatedProjection = createProjection();

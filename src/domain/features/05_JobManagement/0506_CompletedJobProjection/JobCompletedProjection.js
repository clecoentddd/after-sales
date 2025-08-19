import { jobEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

function createProjection() {
  const state = {};
  const listeners = new Set();

  const projection = {
    getAll() {
      const allJobs = Object.values(state);
      console.log('[JobCompletedProjection] getAll ->', allJobs);
      return allJobs;
    },

    subscribe(callback) {
      listeners.add(callback);
      console.log('[JobCompletedProjection] New subscriber added, sending current state...');
      callback([...projection.getAll()]);
      return () => {
        console.log('[JobCompletedProjection] Subscriber removed');
        listeners.delete(callback);
      };
    },

    notify() {
      console.log('[JobCompletedProjection] Notifying subscribers with state:', Object.values(state));
      listeners.forEach(cb => cb([...projection.getAll()]));
    },

    reset({ silent = false } = {}) {
      console.log('[JobCompletedProjection] Resetting state');
      for (const key in state) delete state[key];

      if (!silent) {
        listeners.forEach(cb => cb([]));
      }
    },

    handleEvent(event) {
      const jobId = event.aggregateId;
      if (!jobId) return;

      console.log('[JobCompletedProjection] Handling event:', event);

      switch (event.type) {
        case 'JobCompleted':
          state[jobId] = {
            jobId,
            requestId: event.requestId,
            changeRequestId: event.changeRequestId,
            ...event.data
          };
          console.log(`[JobCompletedProjection] JobCompleted -> added jobId: ${jobId}`);
          break;

        case 'JobCreated':
        case 'JobStarted':
          if (state[jobId]) {
            delete state[jobId];
            console.log(`[JobCompletedProjection] ${event.type} -> removed jobId: ${jobId}`);
          }
          break;

        default:
          console.warn('[JobCompletedProjection] Unknown event type:', event.type);
      }

      projection.notify();
    },

async rebuild() {
  console.log('[JobCompletedProjection] Rebuilding projection from event store...');

  // 1️⃣ Clear state silently
  projection.reset({ silent: true });

  // 2️⃣ Wait 0.5s to visually show empty state
  setTimeout(async () => {
    const events = await jobEventStore.getEvents();

    // Replay events without notifying each time
    events.forEach(e => projection.handleEvent(e, { notify: false }));

    // Notify once after all events are applied
    projection.notify();

    console.log('[JobCompletedProjection] Rebuild complete.');
  }, 500);
},


    queryCompletedJobsList(requestId) {
      const job = Object.values(state).find(j => j.requestId === requestId);
      console.log('[JobCompletedProjection] queryCompletedJobsList -> requestId:', requestId, 'result:', job);
      return job ? job.jobId : null;
    }
  };

  // auto-subscribe to relevant events
  eventBus.subscribe('JobCreated', event => projection.handleEvent(event));
  eventBus.subscribe('JobStarted', event => projection.handleEvent(event));
  eventBus.subscribe('JobCompleted', event => projection.handleEvent(event));

  return projection;
}

export const JobCompletedProjection = createProjection();

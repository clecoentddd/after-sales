import { jobEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

function createProjection() {
  const state = {};
  const listeners = new Set();

  const projection = {
    getAll() {
      const allJobs = Object.values(state);
      console.log('[JobStartedProjection] getAll ->', allJobs);
      return allJobs;
    },

    subscribe(callback) {
      listeners.add(callback);
      console.log('[JobStartedProjection] New subscriber added, sending current state...');
      callback([...projection.getAll()]);
      return () => {
        console.log('[JobStartedProjection] Subscriber removed');
        listeners.delete(callback);
      };
    },

    notify() {
      console.log('[JobStartedProjection] Notifying subscribers with state:', Object.values(state));
      listeners.forEach(cb => cb([...projection.getAll()]));
    },

    reset({ silent = false } = {}) {
      console.log('[JobStartedProjection] Resetting state');
      for (const key in state) delete state[key];

      if (!silent) {
        // only notify if caller *wants* subscribers to see empty state
        listeners.forEach(cb => cb([]));
      }
    },

    handleEvent(event) {
      const jobId = event.aggregateId;
      if (!jobId) return;

      console.log('[JobStartedProjection] Handling event:', event);

      switch (event.type) {
        case 'JobStarted':
          state[jobId] = {
            jobId,
            requestId: event.requestId,
            changeRequestId: event.changeRequestId,
            ...event.data
          };
          console.log(`[JobStartedProjection] JobStarted -> added/updated jobId: ${jobId}`);
          break;

        case 'JobCreated':
        case 'JobCompleted':
          if (state[jobId]) {
            delete state[jobId];
            console.log(`[JobStartedProjection] ${event.type} -> removed jobId: ${jobId}`);
          }
          break;

        default:
          console.warn('[JobStartedProjection] Unknown event type:', event.type);
      }

      projection.notify();
    },

    async rebuild() {
  console.log('[JobStartedProjection] Rebuilding projection from event store...');

  // 1️⃣ Clear state but don't notify yet
  projection.reset({ silent: true });

  // 2️⃣ Wait 0.5s to show empty state
  setTimeout(async () => {
    const events = await jobEventStore.getEvents();

    // Replay events without notifying each time
    events.forEach(e => projection.handleEvent(e, { notify: false }));

    // Notify once after all events
    projection.notify();

    console.log('[JobStartedProjection] Rebuild complete.');
  }, 500);
},

    queryStartedJobsList(requestId) {
      const job = Object.values(state).find(j => j.requestId === requestId);
      console.log('[JobStartedProjection] queryStartedJobsList -> requestId:', requestId, 'result:', job);
      return job ? job.jobId : null;
    }
  };

  // auto-subscribe to relevant events
  eventBus.subscribe('JobCreated', event => projection.handleEvent(event));
  eventBus.subscribe('JobStarted', event => projection.handleEvent(event));
  eventBus.subscribe('JobCompleted', event => projection.handleEvent(event));

  return projection;
}

export const JobStartedProjection = createProjection();

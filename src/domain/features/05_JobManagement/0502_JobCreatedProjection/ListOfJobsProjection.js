import { jobEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

function createProjection() {
  const state = {};
  const listeners = new Set();

  const projection = {
    getAll() {
      const allJobs = Object.values(state);
      console.log('[AllJobsProjection] getAll ->', allJobs);
      return allJobs;
    },

    subscribe(callback) {
      listeners.add(callback);
      console.log('[AllJobsProjection] New subscriber added, sending current state...');
      callback([...projection.getAll()]);
      return () => {
        console.log('[AllJobsProjection] Subscriber removed');
        listeners.delete(callback);
      };
    },

    notify() {
      console.log('[AllJobsProjection] Notifying subscribers with state:', Object.values(state));
      listeners.forEach(cb => cb([...projection.getAll()]));
    },

    reset() {
      console.log('[AllJobsProjection] Resetting state');
      for (const key in state) delete state[key];
      setTimeout(() => {
        console.log('[AllJobsProjection] Notifying subscribers after reset');
        listeners.forEach(cb => cb([]));
      }, 100);
    },

    handleEvent(event) {
      const jobId = event.aggregateId;
      if (!jobId) return;

      console.log('[AllJobsProjection] Handling event:', event);

      if (event.type === 'JobCreated') {
        state[jobId] = { 
            jobId, 
            requestId: event.requestId,     // <- include this
            changeRequestId: event.changeRequestId, // optional if needed
            ...event.data 
        };
            console.log(`[AllJobsProjection] JobCreated -> added jobId: ${jobId}`, state[jobId]);
        }

      projection.notify();
    },

    async rebuild() {
      console.log('[AllJobsProjection] Rebuilding projection from event store...');
      const events = await jobEventStore.getEvents();
      projection.reset();
      events.forEach(e => projection.handleEvent(e));
      console.log('[AllJobsProjection] Rebuild complete.');
    },

    queryAllJobsByRequestId(requestId) {
      const jobs = Object.values(state).filter(j => j.requestId === requestId);
      console.log('[AllJobsProjection] queryAllJobsByRequestId -> requestId:', requestId, 'result:', jobs);
      return jobs;
    }
  };

  // auto-subscribe only to JobCreated
  eventBus.subscribe('JobCreated', event => {
    console.log('[AllJobsProjection] EventBus -> JobCreated event received');
    projection.handleEvent(event);
  });

  return projection;
}

export const AllJobsProjection = createProjection();

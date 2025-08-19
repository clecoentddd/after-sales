import { jobEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

// Create a temporary cache to store job details from JobCreated events
const jobDetailsCache = {};

function createProjection() {
  const state = {};
  const listeners = new Set();

  // Helper function to get job details from cache or event data
  function getJobDetails(jobId) {
    return jobDetailsCache[jobId] || {};
  }

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
        // Only notify if caller wants subscribers to see empty state
        listeners.forEach(cb => cb([]));
      }
    },

    handleEvent(event, { notify = true } = {}) {
      const jobId = event.aggregateId;
      if (!jobId) return;
      console.log('[JobStartedProjection] Handling event:', event.type, jobId);

      switch (event.type) {
        case 'JobCreated':
          // Cache job details from JobCreated events
          jobDetailsCache[jobId] = {
            jobDetails: event.data.jobDetails,
            quotationId: event.data.quotationId,
            // Cache any other relevant details
          };
          console.log(`[JobStartedProjection] JobCreated -> cached details for jobId: ${jobId}`);

          // Remove from state if it exists (since JobCreated means it's not started yet)
          if (state[jobId]) {
            delete state[jobId];
            console.log(`[JobStartedProjection] JobCreated -> removed jobId: ${jobId}`);
          }
          break;

        case 'JobStarted':
          // Get job details from cache and include them in the state
          const jobDetails = getJobDetails(jobId);
          state[jobId] = {
            jobId,
            requestId: event.requestId,
            changeRequestId: event.changeRequestId,
            ...event.data,
            // Include job details from cache
            jobDetails: jobDetails.jobDetails || event.data.jobDetails || {},
            quotationId: jobDetails.quotationId || event.data.quotationId
          };
          console.log(`[JobStartedProjection] JobStarted -> added/updated jobId: ${jobId} with title:`, state[jobId].jobDetails?.title);
          break;

        case 'JobCompleted':
          if (state[jobId]) {
            delete state[jobId];
            console.log(`[JobStartedProjection] JobCompleted -> removed jobId: ${jobId}`);
          }
          break;

        default:
          console.warn('[JobStartedProjection] Unknown event type:', event.type);
      }

      if (notify) {
        projection.notify();
      }
    },

    async rebuild() {
      console.log('[JobStartedProjection] Rebuilding projection from event store...');

      // 1️⃣ Clear state but don't notify yet
      projection.reset({ silent: true });

      // 2️⃣ Clear cache
      for (const key in jobDetailsCache) delete jobDetailsCache[key];

      // 3️⃣ Wait 0.5s to show empty state
      setTimeout(async () => {
        const events = await jobEventStore.getEvents();

        // First pass: cache all JobCreated events
        events.forEach(e => {
          if (e.type === 'JobCreated') {
            projection.handleEvent(e, { notify: false });
          }
        });

        // Second pass: process all events
        events.forEach(e => {
          projection.handleEvent(e, { notify: false });
        });

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

  // Auto-subscribe to relevant events
  eventBus.subscribe('JobCreated', event => projection.handleEvent(event));
  eventBus.subscribe('JobStarted', event => projection.handleEvent(event));
  eventBus.subscribe('JobCompleted', event => projection.handleEvent(event));

  return projection;
}

export const JobStartedProjection = createProjection();

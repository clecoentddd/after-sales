import { jobEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

function createProjection() {
  const state = {};
  const listeners = new Set();
  // Cache to store job details from JobCreated events
  const jobDetailsCache = {};

  // Helper function to get job details from cache
  function getJobDetails(jobId) {
    return jobDetailsCache[jobId] || {};
  }

  const projection = {
    getAll() {
      const allJobs = Object.values(state);
      console.log('[JobCompletedProjection] getAll ->', allJobs.map(j => ({
        jobId: j.jobId,
        title: j.jobDetails?.title,
        status: 'Completed'
      })));
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
      console.log('[JobCompletedProjection] Notifying subscribers with state:', Object.values(state).map(j => ({
        jobId: j.jobId,
        title: j.jobDetails?.title
      })));
      listeners.forEach(cb => cb([...projection.getAll()]));
    },

    reset({ silent = false } = {}) {
      console.log('[JobCompletedProjection] Resetting state');
      for (const key in state) delete state[key];
      if (!silent) {
        listeners.forEach(cb => cb([]));
      }
    },

    handleEvent(event, { notify = true } = {}) {
      const jobId = event.aggregateId;
      if (!jobId) return;
      console.log('[JobCompletedProjection] Handling event:', event.type, jobId, 'Data:', event.data);

      switch (event.type) {
        case 'JobCreated':
          // Cache job details from JobCreated events
          jobDetailsCache[jobId] = {
            jobDetails: event.data.jobDetails,
            quotationId: event.data.quotationId,
            requestId: event.requestId,
            changeRequestId: event.changeRequestId
          };
          console.log(`[JobCompletedProjection] JobCreated -> cached details for jobId: ${jobId}`, {
            title: event.data.jobDetails?.title,
            quotationId: event.data.quotationId
          });

          // Remove from state if it exists (JobCreated means it's not completed yet)
          if (state[jobId]) {
            delete state[jobId];
            console.log(`[JobCompletedProjection] JobCreated -> removed jobId: ${jobId} from state`);
          }
          break;

        case 'JobCompleted':
          // Get job details from cache
          const cachedDetails = getJobDetails(jobId);
          console.log(`[JobCompletedProjection] JobCompleted for jobId: ${jobId}, cached details:`, cachedDetails);

          state[jobId] = {
            jobId,
            requestId: event.requestId || cachedDetails.requestId,
            changeRequestId: event.changeRequestId || cachedDetails.changeRequestId,
            ...event.data,
            // Include job details from cache
            jobDetails: cachedDetails.jobDetails || event.data.jobDetails || {},
            quotationId: cachedDetails.quotationId || event.data.quotationId
          };

          console.log(`[JobCompletedProjection] JobCompleted -> added jobId: ${jobId} with data:`, {
            title: state[jobId].jobDetails?.title,
            quotationId: state[jobId].quotationId,
            requestId: state[jobId].requestId
          });
          break;

        case 'JobStarted':
          // Remove from state if it exists (JobStarted means it's not completed yet)
          if (state[jobId]) {
            delete state[jobId];
            console.log(`[JobCompletedProjection] JobStarted -> removed jobId: ${jobId} from state`);
          }
          break;

        default:
          console.warn('[JobCompletedProjection] Unknown event type:', event.type);
      }

      if (notify) {
        projection.notify();
      }
    },

    async rebuild() {
      console.log('[JobCompletedProjection] Rebuilding projection from event store...');

      // 1️⃣ Clear state silently
      projection.reset({ silent: true });

      // 2️⃣ Clear cache
      for (const key in jobDetailsCache) delete jobDetailsCache[key];

      // 3️⃣ Get all events and process them in order
      const events = await jobEventStore.getEvents();
      console.log(`[JobCompletedProjection] Found ${events.length} events to process`);

      // First pass: cache all JobCreated events
      events
        .filter(e => e.type === 'JobCreated')
        .forEach(e => {
          projection.handleEvent(e, { notify: false });
        });

      // Second pass: process all events in chronological order
      [...events]
        .sort((a, b) => new Date(a.timestamp || a.metadata?.timestamp) - new Date(b.timestamp || b.metadata?.timestamp))
        .forEach(e => {
          projection.handleEvent(e, { notify: false });
        });

      // Notify once after all events are applied
      projection.notify();
      console.log('[JobCompletedProjection] Rebuild complete. Final state:', Object.values(state).map(j => ({
        jobId: j.jobId,
        title: j.jobDetails?.title
      })));
    },

    queryCompletedJobsList(requestId) {
      const job = Object.values(state).find(j => j.requestId === requestId);
      console.log('[JobCompletedProjection] queryCompletedJobsList -> requestId:', requestId, 'result:', {
        jobId: job?.jobId,
        title: job?.jobDetails?.title
      });
      return job ? job.jobId : null;
    },

    // Debug method to check cache
    getCachedDetails(jobId) {
      return jobDetailsCache[jobId];
    },

    // Debug method to check state
    getState() {
      return { ...state };
    }
  };

  // Auto-subscribe to relevant events
  eventBus.subscribe('JobCreated', event => projection.handleEvent(event));
  eventBus.subscribe('JobStarted', event => projection.handleEvent(event));
  eventBus.subscribe('JobCompleted', event => projection.handleEvent(event));

  return projection;
}

export const JobCompletedProjection = createProjection();

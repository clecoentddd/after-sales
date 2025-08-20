import { eventBus } from '@core/eventBus';
import { jobStorage } from '../projectionDB/sharedJobStorage';
import { rebuildProjections } from '../services/projectionRebuilder';

function createProjection() {
  const listeners = new Set();

  const projection = {
    getAll() {
      return jobStorage.getAll().filter(job => job.status === 'Started');
    },

    subscribe(callback) {
      listeners.add(callback);
      callback([...this.getAll()]);
      return () => listeners.delete(callback);
    },

    notify() {
      listeners.forEach(cb => cb([...this.getAll()]));
    },

    handleEvent(event) {
      const jobId = event.aggregateId;
      if (!jobId) return;

      if (event.type === 'JobStarted') {
        jobStorage.updateStatus(
          jobId,
          'Started',
          event.metadata?.timestamp || event.timestamp
        );
        this.notify();
      }
      else if (event.type === 'JobCompleted') {
        const job = jobStorage.getById(jobId);
        if (job && job.status === 'Started') {
          jobStorage.updateStatus(
            jobId,
            'Completed',
            event.metadata?.timestamp || event.timestamp
          );
          this.notify();
        }
      }
    },

    async rebuild() {
      await rebuildProjections([this]);
    },

    queryStartedJobsList(requestId) {
      return this.getAll().find(j => j.requestId === requestId)?.jobId || null;
    }
  };

  // Subscribe to relevant events
  eventBus.subscribe('JobStarted', event => projection.handleEvent(event));
  eventBus.subscribe('JobCompleted', event => projection.handleEvent(event));

  return projection;
}

export const JobStartedProjection = createProjection();

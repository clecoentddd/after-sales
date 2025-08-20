import { eventBus } from '@core/eventBus';
import { jobStorage } from '../projectionDB/sharedJobStorage';
import { rebuildProjections } from '../services/projectionRebuilder';

function createProjection() {
  const listeners = new Set();

  const projection = {
    getAll() {
      return jobStorage.getAll().filter(job => job.status === 'Completed');
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
      if (!jobId || event.type !== 'JobCompleted') return;

      jobStorage.updateStatus(
        jobId,
        'Completed',
        event.metadata?.timestamp || event.timestamp
      );
      this.notify();
    },

    async rebuild() {
      await rebuildProjections([this]);
    },

    queryCompletedJobsList(requestId) {
      return this.getAll().find(j => j.requestId === requestId)?.jobId || null;
    }
  };

  // Subscribe to JobCompleted events
  eventBus.subscribe('JobCompleted', event => projection.handleEvent(event));

  return projection;
}

export const JobCompletedProjection = createProjection();

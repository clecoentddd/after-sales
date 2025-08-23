import { eventBus } from '@core/eventBus';
import { jobStorage } from '../projectionDB/sharedJobStorage';
import { rebuildProjections } from '../services/projectionRebuilder';

function createProjection() {
  const listeners = new Set();
  const projection = {
    getAll() {
      return jobStorage.getAll().filter(job => job.status === 'Pending');
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

      if (event.type === 'JobCreated') {
        jobStorage.upsert({
          jobId: jobId,
          status: 'Pending',
          requestId: event.requestId,
          changeRequestId: event.changeRequestId,
          ...event.data,
          createdAt: event.metadata?.timestamp || event.timestamp
        });
        this.notify();
      }
      else if (event.type === 'JobStarted' || event.type === 'JobCompleted') {
        console.log(`[JobCreatedProjection] Handling ${event.type} event for job:`, jobId);
        const job = jobStorage.getById(jobId);
        if (job && job.status === 'Pending') {
          jobStorage.updateStatus(
            jobId,
            event.type === 'JobStarted' ? 'Started' : 'Completed',
            event.metadata?.timestamp || event.timestamp
          );
          this.notify();
        }
      }
    },
    async rebuild() {
      await rebuildProjections([this]);
    },
    queryCreatedJobsList(requestId) {
      const job = this.getAll().find(j => j.requestId === requestId);
      console.log('[JobCreatedProjection] queryCreatedJobsList for requestId:', requestId, 'result:', job);
      return job ? { jobId: job.jobId, CRstatus: job.CRstatus } : null;
    }
  };

  // Subscribe to all relevant events
  eventBus.subscribe('JobCreated', event => projection.handleEvent(event));
  eventBus.subscribe('JobStarted', event => projection.handleEvent(event));
  eventBus.subscribe('JobCompleted', event => projection.handleEvent(event));

  return projection;
}

export const JobCreatedProjection = createProjection();

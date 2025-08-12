import { jobEventStore } from '@core/eventStore';
import { JobAggregate } from './aggregate';

export class JobRepository {
  async getById(jobId) {
    const events =  jobEventStore.getEvents(); // could optimize with jobId filter in store
    const jobEvents = events.filter(e => e.aggregateId === jobId);

    const aggregate = new JobAggregate();
    aggregate.replay(jobEvents);
    return aggregate;
  }

  async save(event) {
    await jobEventStore.append(event);
  }
}

export const reconstructJobState = (jobId) =>
  new JobRepository().reconstructJobState(jobId);
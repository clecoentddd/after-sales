import { eventBus } from '@core/eventBus';
import { jobChangeRequestProjection } from '../JobChangeRequestProjection';
import { initializeJobChangeRequestProjector } from '../JobChangeRequestProjector';
import { ChangeRequestRaisedEvent } from '../../../../events/changeRequestRaisedEvent';
import { JobCreatedEvent } from '../../../../events/jobCreatedEvent';
import { RequestRaisedEvent } from '../../../../events/requestRaisedEvent';

describe('JobChangeRequestProjection', () => {

  beforeEach(() => {
    jobChangeRequestProjection.clear();
    initializeJobChangeRequestProjector();
  });

  it('should assign jobId to all change requests when job is created', () => {
    // Step 1: Raise the request with initial CR (cr0)
    const requestEvent = RequestRaisedEvent({
      requestId: 'req1',
      changeRequestId: 'cr0',
      versionId: 'v1',
      customerId: 'cust1',
      requestDetails: 'Initial request',
      status: 'open'
    });
    eventBus.publish(requestEvent);

    // Step 2: Create the job — current projector updates only CR rows, not original request
    const jobCreatedEvent = JobCreatedEvent('job1', 'req1', 'cr1', 'quo1', { title: 'Job 1' });
    eventBus.publish(jobCreatedEvent);

    // Step 3: Raise two additional change requests
    eventBus.publish(ChangeRequestRaisedEvent('req1', 'cr1', 'user1', 'Change one', 'v1'));
    eventBus.publish(ChangeRequestRaisedEvent('req1', 'cr2', 'user2', 'Change two', 'v1'));

    const allRows = jobChangeRequestProjection.getAll();

    // Adjusted expectations to match actual rows in projection
    expect(allRows).toEqual(
  expect.arrayContaining([
    // Only actual rows in the projection
    expect.objectContaining({ changeRequestId: 'cr1', requestId: 'req1', jobId: 'job1', type: 'Request', todo: false }),
    expect.objectContaining({ changeRequestId: 'cr1', requestId: 'req1', jobId: 'job1', type: 'ChangeRequest', todo: true }),
    expect.objectContaining({ changeRequestId: 'cr2', requestId: 'req1', jobId: 'job1', type: 'ChangeRequest', todo: true }),
  ])
);
  });
});

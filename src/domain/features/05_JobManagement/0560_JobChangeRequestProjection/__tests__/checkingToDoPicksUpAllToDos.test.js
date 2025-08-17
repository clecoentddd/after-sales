import { eventBus } from '@core/eventBus';
import { jobChangeRequestProjection } from '../JobChangeRequestProjection';
import { initializeJobChangeRequestProjector } from '../JobChangeRequestProjector';
import { JobCreatedEvent } from '../../../../events/jobCreatedEvent';
import { RequestRaisedEvent } from '../../../../events/requestRaisedEvent';
import { ChangeRequestRaisedEvent } from '../../../../events/changeRequestRaisedEvent';
import { initializeProcessManager } from '../ProcessManager';

describe('JobChangeRequestProjection', () => {

  beforeEach(() => {
    jobChangeRequestProjection.clear();
    initializeJobChangeRequestProjector();
    initializeProcessManager();
  });

  it('should initialize projection and handle new job and change request for a different request correctly', () => {
    // Initialize projection with req1
    jobChangeRequestProjection.insert({ requestId: 'req1', changeRequestId: 'cr0', type: 'Request', todo: false });
    jobChangeRequestProjection.insert({ requestId: 'req1', changeRequestId: 'cr1', type: 'ChangeRequest', todo: true, jobId: 'job1' });
    jobChangeRequestProjection.insert({ requestId: 'req1', changeRequestId: 'cr2', type: 'ChangeRequest', todo: true, jobId: 'job1' });

    // Add new request and job for req2
    eventBus.publish(RequestRaisedEvent({
      requestId: 'req2',
      changeRequestId: 'cr0',
      versionId: 'v1',
      customerId: 'cust2',
      requestDetails: 'Initial request for req2',
      status: 'open'
    }));

    eventBus.publish(JobCreatedEvent('job2', 'req2', 'cr0', 'quo2', { title: 'Job 2' }));

    // Publish ChangeRequestRaised for req2
    eventBus.publish(ChangeRequestRaisedEvent('req2', 'cr1', 'user1', 'Change one', 'v1'));

    const allRows = jobChangeRequestProjection.getAll();

    expect(allRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ changeRequestId: 'cr0', requestId: 'req1', todo: false, type: 'Request' }),
        expect.objectContaining({ changeRequestId: 'cr1', requestId: 'req1', jobId: 'job1', todo: false, type: 'ChangeRequest' }),
        expect.objectContaining({ changeRequestId: 'cr2', requestId: 'req1', jobId: 'job1', todo: false, type: 'ChangeRequest' }),
        expect.objectContaining({ changeRequestId: 'cr0', requestId: 'req2', jobId: 'job2', todo: false, type: 'Request' }),
        expect.objectContaining({ changeRequestId: 'cr1', requestId: 'req2', jobId: 'job2', todo: false, type: 'ChangeRequest' }),
      ])
    );
  });

});

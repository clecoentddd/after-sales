import { eventBus } from '@core/eventBus';
import { jobChangeRequestProjection } from '../JobChangeRequestProjection';
import { initializeJobChangeRequestProjector } from '../JobChangeRequestProjector';
import { ChangeRequestRaisedEvent } from '../../../../events/changeRequestRaisedEvent';
import { JobCreatedEvent } from '../../../../events/jobCreatedEvent';

describe('JobChangeRequestProjection', () => {

  beforeEach(() => {
    console.log('[TEST] Clearing projection and initializing projector');
    jobChangeRequestProjection.clear();
    initializeJobChangeRequestProjector();
    console.log('[TEST] Projection after clear:', jobChangeRequestProjection.getAll());
  });

  it('should add a row when ChangeRequestRaised is received', () => {
    const changeRequestEvent = ChangeRequestRaisedEvent('req1', 'cr1', 'user1', 'Some change', 'v1');
    console.log('[TEST] Publishing ChangeRequestRaisedEvent:', changeRequestEvent);
    eventBus.publish(changeRequestEvent);
    
    const allRows = jobChangeRequestProjection.getAll();
    console.log('[TEST] Projection after ChangeRequestRaised:', allRows);
    
    expect(allRows).toEqual([
      { changeRequestId: 'cr1', requestId: 'req1', jobId: null }
    ]);
  });

  it('should update a row with jobId when JobCreated is received', () => {
    const changeRequestEvent = ChangeRequestRaisedEvent('req1', 'cr1', 'user1', 'Some change', 'v1');
    eventBus.publish(changeRequestEvent);

    const jobCreatedEvent = JobCreatedEvent('job1', 'req1', 'cr1', 'quo1', { title: 'Job 1' });
    eventBus.publish(jobCreatedEvent);
    
    const allRows = jobChangeRequestProjection.getAll();
    expect(allRows).toEqual([
      { changeRequestId: 'cr1', requestId: 'req1', jobId: 'job1' }
    ]);
  });

  it('should return all rows initially as empty', () => {
    const allRows = jobChangeRequestProjection.getAll();
    expect(allRows).toEqual([]);
  });

it('should publish CreatedJobAssignedToChangeRequestEvent when jobId is assigned', (done) => {
  const changeRequestEvent = ChangeRequestRaisedEvent('req1', 'cr1', 'user1', 'Some change', 'v1');
  eventBus.publish(changeRequestEvent);

  // Subscribe and immediately unsubscribe after first hit
  const handler = (event) => {
    console.log('[TEST] Received synthetic event:', event);
    try {
      expect(event).toEqual({
        type: 'CreatedJobAssignedToChangeRequest',
        aggregateType: 'Projection',
        aggregateId: 'job1',
        requestId: 'req1',
        changeRequestId: 'cr1',
        metadata: expect.any(Object)
      });
      eventBus.unsubscribe('CreatedJobAssignedToChangeRequest', handler); // <— unsubscribe
      done();
    } catch (err) {
      done(err);
    }
  };

  eventBus.subscribe('CreatedJobAssignedToChangeRequest', handler);

  const jobCreatedEvent = JobCreatedEvent('job1', 'req1', 'cr1', 'quo1', { title: 'Job 1' });
  console.log('[TEST] Publishing JobCreatedEvent:', jobCreatedEvent);
  eventBus.publish(jobCreatedEvent);
});

});



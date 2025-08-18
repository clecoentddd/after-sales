import { eventBus } from '@core/eventBus';
import { jobChangeRequestProjection } from '../JobChangeRequestProjection';
import { initializeJobChangeRequestProjector } from '../JobChangeRequestProjector';
import { initializeProcessManager } from '../../0561_AssignCRtoJob/ProcessManager';
import { JobCreatedEvent } from '../../../../events/jobCreatedEvent';
import { ChangeRequestRaisedEvent } from '../../../../events/changeRequestRaisedEvent';

describe('JobChangeRequest todo workflow', () => {

  beforeEach(() => {
    jobChangeRequestProjection.clear();
    initializeJobChangeRequestProjector();
    initializeProcessManager();
  });

  it('should mark todo=ToDo on insert and then todo=Done after Process Manager processes the event', (done) => {
    const receivedEvents = [];

    // Capture synthetic events for verification
    eventBus.subscribe('CreatedJobAssignedToChangeRequest', (event) => {
      receivedEvents.push(event);
    });

    // Step 1: Job created
    const jobCreated = JobCreatedEvent('job1', 'req1', 'cr0', 'quo1', { title: 'Job 1' });
    eventBus.publish(jobCreated);

    // Step 2: Raise two change requests
    const cr1 = ChangeRequestRaisedEvent('req1', 'cr1', 'user1', 'Change one', 'v1');
    const cr2 = ChangeRequestRaisedEvent('req1', 'cr2', 'user2', 'Change two', 'v1');

    eventBus.publish(cr1);
    eventBus.publish(cr2);

    // Small delay to allow Process Manager to process events
    setTimeout(() => {
      const allRows = jobChangeRequestProjection.getAll();

      // Check projection entries
      expect(allRows).toEqual([
        { requestId: 'req1', jobId: 'job1', changeRequestId: 'cr0', type: 'Request', todo: 'Done'},
        { requestId: 'req1', jobId: 'job1', changeRequestId: 'cr1', type: 'ChangeRequest', todo: 'Done' },
        { requestId: 'req1', jobId: 'job1', changeRequestId: 'cr2', type: 'ChangeRequest', todo: 'Done' },
      ]);

      // Check synthetic events
      expect(receivedEvents).toEqual(expect.arrayContaining([
        expect.objectContaining({ changeRequestId: 'cr1' }),
        expect.objectContaining({ changeRequestId: 'cr2' }),
      ]));

      done();
    }, 50); // 50ms should be enough in test environment
  });

});

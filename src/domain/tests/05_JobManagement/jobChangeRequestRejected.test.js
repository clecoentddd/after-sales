// tests/jobChangeRequestRejected.test.js

import { JobAggregate } from '../../entities/Job/aggregate';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { JobStartedEvent } from '../../events/jobStartedEvent';
import { JobCompletedEvent } from '../../events/jobCompletedEvent';
import { ChangeRequestJobAssignedEvent } from '../../events/changeRequestJobAssignedEvent';
import { JobCompletedChangeRequestRejectedEvent } from '../../events/jobCompletedChangeRequestRejectedEvent';
import { RejectChangeRequestForCompletedJobCommand } from '../../features/05_JobManagement/0513_RejectChangeRequest/commands';
import { RejectChangeRequestForCompletedJobCommandHandler } from '../../features/05_JobManagement/0513_RejectChangeRequest/commandHandler';
import { jobEventStore } from '../../core/eventStore';


describe('JobChangeRequestRejected for completed jobs', () => {
  beforeEach(() => {
     jobEventStore.clear(); // reset store before each test
  });

  it('should reject a change request if job is already completed', () => {
    // --- Step 1: Build event history for a completed job ---
    const jobId = 'job-123';
    const requestId = 'req-1';
    const changeRequestId = 'cr-xyz';

    const history = [
      JobCreatedEvent(jobId, requestId, null, 'quote-1', { title: 'Test Job' }, 'Pending'),
      JobStartedEvent(jobId, requestId, null, 'Team A', 'user-1'),
      JobCompletedEvent(jobId, requestId, null, 'user-2', { notes: 'done' }),
    ];

    history.forEach(ev => jobEventStore.append(ev));

    // --- Step 2: Simulate a ChangeRequestJobAssignedEvent ---
    const assignedEvent = ChangeRequestJobAssignedEvent(
      jobId,
      requestId,
      changeRequestId,
      { assignedBy: 'system' }
    );

    // --- Step 3: Build command ---
    const command = RejectChangeRequestForCompletedJobCommand(
      jobId,
      requestId,
      changeRequestId,
      'Job already completed',
      'system'
    );

    // --- Step 4: Call handler ---
    const rejectedEvent = RejectChangeRequestForCompletedJobCommandHandler.handle(command);

    console.log('[TEST] Command executed:', command);
    console.log('[TEST] Rejected event returned by handler:', rejectedEvent);
    console.log('[TEST] Events in jobEventStore:', jobEventStore.events);

    // --- Step 5: Assertions ---
expect(rejectedEvent).toEqual(
  expect.objectContaining({
    type: 'JobChangeRequestRejected',
    aggregateId: jobId,
    aggregateType: 'Job',
    requestId,
    changeRequestId,
    data: { reason: 'Job already completed' },
    metadata: expect.objectContaining({
      timestamp: expect.any(String),
    }),
  })
);

    // Ensure CRstatus remains null
    const aggregate = new JobAggregate();
    aggregate.replay(jobEventStore.getEventsByAggregateId(jobId));
    expect(aggregate.CRstatus).toBeNull();
  });
});

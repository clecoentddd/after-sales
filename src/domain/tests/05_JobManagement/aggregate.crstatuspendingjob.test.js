// src/domain/entities/Job/aggregate.crstatus.test.js
import { JobAggregate } from '../../entities/Job/aggregate';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { JobOnHoldEvent } from '../../events/jobOnHoldEvent';

describe('JobAggregate CRstatus rules', () => {
  let aggregate;
  const jobId = 'job-123';
  const requestId = 'req-1';
  const changeRequestId = 'cr-1';
  const heldByUserId = 'user-2';
  const startedByUserId = 'user-1';

  beforeEach(() => {
    aggregate = new JobAggregate();
    aggregate.apply(
      JobCreatedEvent(
        jobId,
        requestId,
        changeRequestId,
        'quotation-1',
        { title: 'Test', operations: 'Ops', currency: 'USD', estimatedAmount: 100 }
      )
    );
  });

  test('should allow putting job on hold when in Pending status', () => {
    const onHoldEvent = aggregate.putOnHold({
      jobId,
      heldByUserId,
      reason: 'Change request assigned',
      changeRequestId
    });

    expect(onHoldEvent).toHaveProperty('type', 'JobOnHold');
    expect(onHoldEvent.data.CRstatus).toBe('OnHold');
    expect(onHoldEvent.data.reason).toBe('Change request assigned');

    // Apply the event to update aggregate state
    aggregate.apply(onHoldEvent);
    expect(aggregate.CRstatus).toBe('OnHold');
    expect(aggregate.status).toBe('Pending'); // Overall status remains Pending
  });

  test('should prevent starting a job when CRstatus is "OnHold"', () => {
    // First put the job on hold
    const onHoldEvent = aggregate.putOnHold({
      jobId,
      heldByUserId,
      reason: 'Change request assigned',
      changeRequestId
    });
    aggregate.apply(onHoldEvent);

    // Verify CRstatus is set
    expect(aggregate.CRstatus).toBe('OnHold');

    // Try to start the job - should throw error
    expect(() =>
      aggregate.start({ jobId, assignedTeam: 'TeamA', startedByUserId })
    ).toThrow(/Job is on hold \(CRstatus: OnHold\)/);

    // Verify job status is still Pending
    expect(aggregate.status).toBe('Pending');
  });

  test('should allow starting a job when CRstatus is not "OnHold"', () => {
    // Job is in Pending status with no CRstatus set
    expect(aggregate.status).toBe('Pending');
    expect(aggregate.CRstatus).toBeNull();

    // Should be able to start the job
    const startEvent = aggregate.start({
      jobId,
      assignedTeam: 'TeamA',
      startedByUserId
    });

    expect(startEvent).toHaveProperty('type', 'JobStarted');
  });

  test('should allow starting a job after CRstatus was "OnHold" but then cleared', () => {
    // First put the job on hold
    const onHoldEvent = aggregate.putOnHold({
      jobId,
      heldByUserId,
      reason: 'Change request assigned',
      changeRequestId
    });
    aggregate.apply(onHoldEvent);
    expect(aggregate.CRstatus).toBe('OnHold');

    // Simulate clearing the hold (you would need a JobReleasedEvent or similar)
    // For now, we'll directly modify the state for testing purposes
    aggregate.CRstatus = null;

    // Should now be able to start the job
    const startEvent = aggregate.start({
      jobId,
      assignedTeam: 'TeamA',
      startedByUserId
    });

    expect(startEvent).toHaveProperty('type', 'JobStarted');
  });

  test('JobOnHold event should set CRstatus but not change overall status', () => {
    const onHoldEvent = JobOnHoldEvent(
      jobId,
      requestId,
      changeRequestId,
      heldByUserId,
      'Change request assigned'
    );

    // Apply the event
    aggregate.apply(onHoldEvent);

    // Verify CRstatus is set but overall status remains Pending
    expect(aggregate.CRstatus).toBe('OnHold');
    expect(aggregate.status).toBe('Pending');
    expect(aggregate.onHoldReason).toBe('Change request assigned');
  });
});

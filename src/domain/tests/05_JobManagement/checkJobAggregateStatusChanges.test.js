import { JobAggregate } from '../../entities/Job/aggregate';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { JobStartedEvent } from '../../events/jobStartedEvent';
import { JobCompletedEvent } from '../../events/jobCompletedEvent';
import { JobOnHoldEvent } from '../../events/jobOnHoldEvent';
import { JobFlaggedForAssessmentEvent } from '../../events/jobFlaggedForAssessmentEvent';

describe('JobAggregate command rules', () => {
  let aggregate;
  const jobId = 'job-123';
  const requestId = 'req-1';
  const changeRequestId = 'cr-1';
  const startedByUserId = 'user-1';
  const heldByUserId = 'user-2';
  const completedBy = 'user-3';
  const flaggedByUserId = 'user-4';

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

  test('initial state should be Pending', () => {
    expect(aggregate.status).toBe('Pending');
  });

  test('Pending allows start and putOnHold', () => {
    const startEvent = aggregate.start({ jobId, assignedTeam: 'TeamA', startedByUserId });
    expect(startEvent).toHaveProperty('type', 'JobStarted');

    const onHoldEvent = aggregate.putOnHold({ jobId, heldByUserId, reason: 'reason' });
    expect(onHoldEvent).toHaveProperty('type', 'JobOnHold');
  });

  test('OnHold disallows start', () => {
    // Apply JobOnHoldEvent first to simulate state
    aggregate.apply(JobOnHoldEvent({ jobId, requestId, changeRequestId, heldByUserId, reason: 'reason' }));

    expect(() =>
      aggregate.start({ jobId, assignedTeam: 'TeamA', startedByUserId })
    ).toThrow(/Cannot start job/);
  });

  test('Pending disallows complete and flagForAssessment', () => {
    expect(() => aggregate.complete({ jobId, completedBy, completionDetails: {} })).toThrow();
    expect(aggregate.flagForAssessment({ jobId, flaggedByUserId, reason: 'reason' })).toBeNull();
  });

  test('Started allows complete and flagForAssessment', () => {
    // Apply JobStartedEvent first
    const startEvent = aggregate.start({ jobId, assignedTeam: 'TeamA', startedByUserId });
    aggregate.apply(startEvent);

    const completeEvent = aggregate.complete({ jobId, completedBy, completionDetails: {} });
    expect(completeEvent).toHaveProperty('type', 'JobCompleted');

    const flagEvent = aggregate.flagForAssessment({ jobId, flaggedByUserId, reason: 'reason' });
    expect(flagEvent).toHaveProperty('type', 'ChangeRequestReceivedPendingAssessment');
  });

  test('Started disallows start and putOnHold', () => {
    const startEvent = aggregate.start({ jobId, assignedTeam: 'TeamA', startedByUserId });
    aggregate.apply(startEvent);

    expect(() => aggregate.start({ jobId, assignedTeam: 'TeamA', startedByUserId })).toThrow();
    expect(aggregate.putOnHold({ jobId, heldByUserId, reason: 'reason' })).toBeNull();
  });

  test('starting a Pending job returns a JobStartedEvent without mutating state', () => {
    const event = aggregate.start({ jobId, assignedTeam: 'TeamA', startedByUserId });

    expect(event).toHaveProperty('type', 'JobStarted');
    expect(event.aggregateId).toBe(jobId);
    expect(event.data.assignedTeam).toBe('TeamA');
    expect(event.data.startedByUserId).toBe(startedByUserId);

    // State is still Pending until we apply the event
    expect(aggregate.status).toBe('Pending');

    // Now we apply the event to change state
    aggregate.apply(event);
    expect(aggregate.status).toBe('Started');
  });
});

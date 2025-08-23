// tests/domain/features/JobManagement/jobAggregate.test.js
import { JobAggregate } from '../../entities/Job/aggregate';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { JobStartedEvent } from '../../events/jobStartedEvent';
import { jobEventStore } from '../../core/eventStore';
import { JobOnHoldEvent } from '../../events/jobOnHoldEvent';
import { JobFlaggedForAssessmentEvent } from '../../events/jobFlaggedForAssessmentEvent';

describe('JobAggregate', () => {
  beforeEach(async () => {
    // Clear the event store before each test
    await jobEventStore.clear();
  });

  it('should return JobOnHoldEvent when job status is Pending', async () => {
    // 1. Create a JobCreatedEvent
    const jobId = 'job-123';
    const requestId = 'request-456';
    const changeRequestId = 'cr-789';
    const quotationId = 'quotation-101';
    const jobDetails = {
      title: 'Test Job',
      description: 'Test job description',
      priority: 'Normal',
      assignedTeam: 'Unassigned',
      currency: 'USD',
      amount: 1000,
    };

    const jobCreatedEvent = JobCreatedEvent(
      jobId,
      requestId,
      changeRequestId,
      quotationId,
      jobDetails,
      'Pending'
    );

    // 2. Append the event to the event store
    await jobEventStore.append(jobCreatedEvent);

    // 3. Rehydrate the aggregate
    const events = await jobEventStore.getEvents(jobId);
    const jobAggregate = new JobAggregate();
    jobAggregate.replay(events);

    // 4. Call AssessChangeRequest
    const command = {
      changeRequestId: 'cr-789',
      heldByUserId: 'user-123',
      reason: 'Pending assessment',
    };

    const resultEvent = jobAggregate.AssessChangeRequest(command);

    // 5. Verify the result
    expect(resultEvent.type).toBe('JobOnHold');
    expect(resultEvent.aggregateId).toBe(jobId);
    expect(resultEvent.requestId).toBe(requestId);
    expect(resultEvent.changeRequestId).toBe(changeRequestId);
    expect(resultEvent.data.reason).toBe(command.reason);
  });

  it('should return JobFlaggedForAssessmentEvent when job status is Started', async () => {
    // 1. Create a JobCreatedEvent
    const jobId = 'job-456';
    const requestId = 'request-789';
    const changeRequestId = 'cr-101';
    const quotationId = 'quotation-202';
    const jobDetails = {
      title: 'Test Job (Started)',
      description: 'Test job description for started job',
      priority: 'Normal',
      assignedTeam: 'Team A',
      currency: 'USD',
      amount: 2000,
    };

    const jobCreatedEvent = JobCreatedEvent(
      jobId,
      requestId,
      changeRequestId,
      quotationId,
      jobDetails,
      'Pending'
    );

    // 2. Create a JobStartedEvent
    const jobStartedEvent = JobStartedEvent(
      jobId,
      requestId,
      changeRequestId,
      'Team A',
      'user-456'
    );

    // 3. Append both events to the event store
    await jobEventStore.append(jobCreatedEvent);
    await jobEventStore.append(jobStartedEvent);

    // 4. Rehydrate the aggregate
    const events = await jobEventStore.getEvents(jobId);
    const jobAggregate = new JobAggregate();
    jobAggregate.replay(events);

    // 5. Call AssessChangeRequest
    const command = {
      changeRequestId: 'cr-101',
      flaggedByUserId: 'user-789',
      reason: 'Needs assessment',
    };

    const resultEvent = jobAggregate.AssessChangeRequest(command);

    // 6. Verify the result
    expect(resultEvent.type).toBe('ChangeRequestReceivedPendingAssessment');
    expect(resultEvent.aggregateId).toBe(jobId);
    expect(resultEvent.requestId).toBe(requestId);
    expect(resultEvent.changeRequestId).toBe(changeRequestId);
    expect(resultEvent.data.flaggedByUserId).toBe(command.flaggedByUserId);
    expect(resultEvent.data.reason).toBe(command.reason);
  });
});

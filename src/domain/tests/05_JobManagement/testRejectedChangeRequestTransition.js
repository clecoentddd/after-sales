// tests/domain/features/JobManagement/jobAggregate.test.js
import { JobAggregate } from '../../entities/Job/aggregate';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { JobStartedEvent } from '../../events/jobStartedEvent';
import { JobCompletedEvent } from '../../events/jobCompletedEvent';
import { jobEventStore } from '../../core/eventStore';
import { JobOnHoldEvent } from '../../events/jobOnHoldEvent';
import { JobFlaggedForAssessmentEvent } from '../../events/jobFlaggedForAssessmentEvent';
import { JobCompletedChangeRequestRejectedEvent } from '../../events/jobCompletedChangeRequestRejectedEvent';

describe('JobAggregate', () => {
  beforeEach(async () => {
    // Clear the event store before each test
    await jobEventStore.clear();
  });

  it('should return JobOnHoldEvent when job status is Pending', async () => {
    // ... (existing test for Pending status)
  });

  it('should return JobFlaggedForAssessmentEvent when job status is Started', async () => {
    // ... (existing test for Started status)
  });

  it('should return JobCompletedChangeRequestRejectedEvent when job status is Completed', async () => {
    // 1. Create a JobCreatedEvent
    const jobId = 'job-789';
    const requestId = 'request-101';
    const changeRequestId = 'cr-202';
    const quotationId = 'quotation-303';
    const jobDetails = {
      title: 'Test Job (Completed)',
      description: 'Test job description for completed job',
      priority: 'Normal',
      assignedTeam: 'Team B',
      currency: 'USD',
      amount: 3000,
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
      'Team B',
      'user-789'
    );

    // 3. Create a JobCompletedEvent
    const jobCompletedEvent = JobCompletedEvent(
      jobId,
      requestId,
      changeRequestId,
      'user-101',
      { notes: 'Job completed successfully' }
    );

    // 4. Append all events to the event store
    await jobEventStore.append(jobCreatedEvent);
    await jobEventStore.append(jobStartedEvent);
    await jobEventStore.append(jobCompletedEvent);

    // 5. Rehydrate the aggregate
    const events = await jobEventStore.getEvents(jobId);
    const jobAggregate = new JobAggregate();
    jobAggregate.replay(events);

    // 6. Call AssessChangeRequest
    const command = {
      changeRequestId: 'cr-202',
      reason: 'Change request for completed job',
    };

    const resultEvent = jobAggregate.AssessChangeRequest(command);

    // 7. Verify the result
    expect(resultEvent.type).toBe('JobCompletedChangeRequestRejected');
    expect(resultEvent.aggregateId).toBe(jobId);
    expect(resultEvent.requestId).toBe(requestId);
    expect(resultEvent.changeRequestId).toBe(changeRequestId);
    expect(resultEvent.data.reason).toContain('Job already completed');
    expect(resultEvent.data.rejectedBy).toBe('Automated Response from System');
  });
});

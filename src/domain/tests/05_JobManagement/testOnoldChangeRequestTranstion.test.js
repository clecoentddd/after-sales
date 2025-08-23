// tests/domain/features/JobManagement/jobAggregate.test.js
import { JobAggregate } from '../../entities/Job/aggregate';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { jobEventStore } from '../../core/eventStore';
import { jobOnHoldEvent } from '../../events/jobOnHoldEvent';

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
});

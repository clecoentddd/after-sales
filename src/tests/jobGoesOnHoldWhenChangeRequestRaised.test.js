// src/tests/jobGoesOnHoldWhenChangeRequestRaised.test.js

import { initializeChangeRequestToJobReactionProcessor } from '../domain/features/99_changeRequestToJobReactionProcessor/changeRequestToJobReactionProcessor';
import { eventBus } from '../domain/core/eventBus';
import { jobEventStore } from '../domain/core/eventStore';
import { JobCreatedEvent } from '../domain/events/jobCreatedEvent';

describe('Job goes on hold when change request is raised', () => {
  const requestId = 'req-001';
  const jobId = 'job-001';
  const customerId = 'cust-001';
  const quotationId = 'quote-123';
  const userId = 'user-xyz';
  const changeRequestId = 'change-987';

  beforeEach(() => {
    // Reset stores and listeners before each test
    jobEventStore.clear();

    // Seed the job store with a created job
    jobEventStore.append(
      JobCreatedEvent(
        jobId,
        customerId,
        requestId,
        quotationId,
        {
          title: 'Fix pipe',
          description: 'Urgent water pipe repair',
          priority: 'Normal',
          assignedTeam: 'Team A'
        },
        'Pending'
      )
    );

    initializeChangeRequestToJobReactionProcessor();
  });

  it('should put the job on hold when change request is raised', () => {
    // Act: publish the ChangeRequestRaised event
    const event = {
      type: 'ChangeRequestRaised',
      data: {
        requestId,
        changeRequestId,
        changedByUserId: userId,
        description: 'Update customer contact info'
      },
      timestamp: new Date().toISOString()
    };

    eventBus.publish(event);

    // Assert: a JobOnHold event was created for that job
    const allEvents = jobEventStore.getEvents();
    const jobOnHoldEvents = allEvents.filter(e => e.type === 'JobOnHold' && e.data.jobId === jobId);

    expect(jobOnHoldEvents.length).toBe(1);
    expect(jobOnHoldEvents[0].data.status).toBe('OnHold');
    expect(jobOnHoldEvents[0].data.reason).toContain('Change request raised');
    expect(jobOnHoldEvents[0].data.changeRequestId).toBe(changeRequestId);
  });
});

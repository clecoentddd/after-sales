// src/tests/jobShouldBeFlaggedPendingAssessmentWhenChangeRequestRaised.test.js

import { initializeChangeRequestToJobReactionProcessor } from '../domain/features/99_changeRequestToJobReactionProcessor/changeRequestToJobReactionProcessor';
import { eventBus } from '../domain/core/eventBus';
import { jobEventStore } from '../domain/core/eventStore';
import { JobCreatedEvent } from '../domain/events/jobCreatedEvent';
import { JobStartedEvent } from '../domain/events/jobStartedEvent';

describe('Job flagged as ChangeRequestReceivedPendingAssessment when change request is raised and job already started', () => {
  const requestId = 'req-002';
  const jobId = 'job-002';
  const customerId = 'cust-002';
  const quotationId = 'quote-999';
  const userId = 'user-abc';
  const changeRequestId = 'change-654';

  beforeEach(() => {
    // Clear event store
    jobEventStore.clear();

    // Seed with a created and then started job
    jobEventStore.append(
      JobCreatedEvent(
        jobId,
        customerId,
        requestId,
        quotationId,
        {
          title: 'Replace heater',
          description: 'Heating issue in customer flat',
          priority: 'High',
          assignedTeam: 'Team B'
        },
        'Pending'
      )
    );

    jobEventStore.append(
      JobStartedEvent(
        jobId,
        requestId,
        'Team B',
        userId
      )
    );

    initializeChangeRequestToJobReactionProcessor();
  });

  it('should mark job as ChangeRequestReceivedPendingAssessment, not put on hold', () => {
    // Act: simulate a raised change request
    const event = {
      type: 'ChangeRequestRaised',
      data: {
        requestId,
        changeRequestId,
        changedByUserId: userId,
        description: 'Add inspection photos'
      },
      timestamp: new Date().toISOString()
    };

    eventBus.publish(event);

    // Assert: should NOT get a JobOnHold event
    const allEvents = jobEventStore.getEvents();
    const jobOnHoldEvents = allEvents.filter(e => e.type === 'JobOnHold' && e.data.jobId === jobId);
    const assessmentFlagEvent = allEvents.find(e =>
      e.type === 'JobStatusChanged' &&
      e.data.jobId === jobId &&
      e.data.newStatus === 'ChangeRequestReceivedPendingAssessment'
    );

    expect(jobOnHoldEvents.length).toBe(0);
    expect(assessmentFlagEvent).toBeDefined();
    expect(assessmentFlagEvent.data.reason).toContain('Change request raised');
  });
});

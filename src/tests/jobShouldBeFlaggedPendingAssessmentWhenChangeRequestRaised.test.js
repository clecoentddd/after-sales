// src/tests/jobShouldBeFlaggedPendingAssessmentWhenChangeRequestRaised.test.js

import { initializeChangeRequestToJobReactionProcessor } from '../domain/features/99_changeRequestToJobReactionProcessor/changeRequestToJobReactionProcessor';
import { eventBus } from '../domain/core/eventBus';
import { jobEventStore } from '../domain/core/eventStore';
import { JobCreatedEvent } from '../domain/events/jobCreatedEvent';
import { JobStartedEvent } from '../domain/events/jobStartedEvent';
import { ChangeRequestRaisedEvent } from '../domain/features/19__RaiseChangeRequest/events';

describe('Job flagged as ChangeRequestReceivedPendingAssessment when change request is raised and job already started', () => {
  const requestId = 'req-002';
  const jobId = 'job-002';
  const customerId = 'cust-002';
  const quotationId = 'quote-999';
  const userId = 'user-abc';
  const changeRequestId = 'change-654';

  beforeEach(() => {
    jobEventStore.clear();

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
    }
  )
);

    jobEventStore.append(
      JobStartedEvent(
        jobId,
        userId,
        'Team B'
      )
    );

    initializeChangeRequestToJobReactionProcessor();
  });

  it('should mark job as ChangeRequestReceivedPendingAssessment, not put on hold', async () => {
  const expectedType = 'ChangeRequestReceivedPendingAssessment';

  // Use a promise to wait for the correct event
  const waitForEvent = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject('Event not received in time'), 1000);

    eventBus.subscribe(expectedType, (event) => {
      if (event.data.jobId === jobId) {
        clearTimeout(timeout);
        resolve(event);
      }
    });
  });

  const event = ChangeRequestRaisedEvent(changeRequestId, requestId, userId, 'Add inspection photos');
  eventBus.publish(event);

  console.log('[Test] Publishing ChangeRequestRaisedEvent:', event);
  eventBus.publish(event);

  const assessmentFlagEvent = await waitForEvent;

  const allEvents = jobEventStore.getEvents();
  const jobOnHoldEvents = allEvents.filter(e => e.type === 'JobOnHoldEvent' && e.data.jobId === jobId);

  expect(jobOnHoldEvents.length).toBe(0);
  expect(assessmentFlagEvent).toBeDefined();
  expect(assessmentFlagEvent.data.reason).toContain('Change request needs assessment');
});

});

// src/tests/assignJobToChangeRequestFailedAsNoJobExists.test.js

import { initializeAssignJobToChangeRequestProcessor } from '../domain/features/99_ToDoChangeRequestProcessManager/initializeAssignJobToChangeRequestProcessor';
import { eventBus } from '../domain/core/eventBus';
import { jobEventStore } from '../domain/core/eventStore';
import { ChangeRequestRaisedEvent } from '../domain/events/changeRequestRaisedEvent';

describe('Assign Job to Change Request - Failure Scenario', () => {
  const requestId = 'req-999'; // Non-existent request ID
  const changeRequestId = 'change-999';
  const userId = 'user-xyz';

  beforeEach(() => {
    jobEventStore.clear();
    initializeAssignJobToChangeRequestProcessor();
  });

  it('should reject change request when no job exists', (done) => {
    // Subscribe to the ChangeRequestRejected event
    eventBus.subscribe('ChangeRequestAssigmentRejected', (event) => {
      try {
        console.log('[Test] Received ChangeRequestRejected event:', event);
        expect(event.type).toBe('ChangeRequestAssigmentRejected');
        expect(event.data.reason).toBe('No job found for request');
        done(); // Notify Jest that the test is complete
      } catch (error) {
        done(error); // If there's an error, notify Jest
      }
    });

    // Publish the ChangeRequestRaised event
    const event = ChangeRequestRaisedEvent(changeRequestId, requestId, userId, 'Some change request');
    eventBus.publish(event);
  });
});

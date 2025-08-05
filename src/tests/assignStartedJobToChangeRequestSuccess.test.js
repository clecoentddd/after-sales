// src/tests/assignJobToChangeRequestSuccess.test.js

import { initializeAssignStartedJobToChangeRequestProcessor } from '../domain/features/29a_SetupJobChangeRequestAssessmentTodoList/initializeAssignStartedJobToChangeRequestProcessor';
import { eventBus } from '../domain/core/eventBus';
import { jobEventStore } from '../domain/core/eventStore';
import { ChangeRequestRaisedEvent } from '../domain/events/changeRequestRaisedEvent';
import { JobCreatedEvent } from '../domain/events/jobCreatedEvent';
import { JobStartedEvent } from '../domain/events/jobStartedEvent';
import { AssignStartedJobToChangeRequestCommand } from '../domain/features/29a_SetupJobChangeRequestAssessmentTodoList/assignStartedJobToChangeRequestCommand';
import { TODO_STATUS, todoList, updateTodoList } from '../domain/features/99_ToDoChangeRequestProcessManager/todoListManager';

describe('Assign Job to Change Request - Success Scenario', () => {
  const jobId = 'job-123';
  const customerId = 'customer-123';
  const requestId = 'req-123';
  const quotationId = 'quotation-123';
  const jobDetails = { description: 'Fix broken screen', type: 'Repair', assignedTeam: 'Tech Team' };
  const changeRequestId = 'change-123';
  const userId = 'user-123';

  beforeEach(() => {
    // Clear the event store and initialize the processor before each test
    jobEventStore.clear();
    initializeAssignStartedJobToChangeRequestProcessor();

    // Create and store a JobCreated event to simulate an existing job
    const jobCreatedEvent = JobCreatedEvent(jobId, customerId, requestId, quotationId, jobDetails, 'Pending');
    jobEventStore.append(jobCreatedEvent);

       const jobStartedEvent = JobStartedEvent(jobId, requestId, jobDetails.assignedTeam, userId);
        jobEventStore.append(jobStartedEvent);

    // Log the event store to verify the job was added
    console.log('[Test Setup] Job Event Store:', jobEventStore.getEvents());
  });

  it('should update the todo list with the change request for assessment when a job exists', (done) => {
    jest.setTimeout(10000); // Increase timeout if necessary

    // Subscribe to the JobAssignedToChangeRequest event
    eventBus.subscribe('StartedJobAssignedToChangeRequest', (event) => {
       try {
        console.log('[Test] Received StartedJobAssignedToChangeRequest event:', event);

        // Verify the job assignment details
        expect(event.type).toBe('StartedJobAssignedToChangeRequest');
        expect(event.data.jobId).toBe(jobId);
        expect(event.data.changeRequestId).toBe(changeRequestId);

        // Check the todoList directly
        const todoItem = todoList.find(item => item.changeRequestId === changeRequestId);
        expect(todoItem).toBeDefined();
        expect(todoItem.jobId).toBe(jobId);
        expect(todoItem.changeRequestId).toBe(changeRequestId);
        expect(todoItem.track).toBe(TODO_STATUS.TO_BE_ASSESSED); // Assuming 'No' means it's pending assessment

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

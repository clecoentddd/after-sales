// Import necessary modules and functions
import { initializeToDoJobToAssessChangeRequest } from '../domain/features/98_AssignJobToChangeRequestProcessor/initializeAssigToDoJobToAssessChangeRequestProcessor';
import { eventBus } from '../domain/core/eventBus';
import { jobEventStore } from '../domain/core/eventStore';
import { JobAssignedToChangeRequestEvent } from '../domain/events/JobAssignedToChangeRequestEvent';
import { JobCreatedEvent } from '../domain/events/jobCreatedEvent';
import { TODO_STATUS, todoList, updateTodoList } from '../domain/features/99_changeRequestToJobReactionProcessor/todoListManager';
import { reconstructJobState } from '../domain/entities/Job/aggregate';

describe('To-Do List Processing - Status Change Scenario', () => {
  const jobId = 'job-123';
  const customerId = 'customer-123';
  const requestId = 'req-123';
  const quotationId = 'quotation-123';
  const jobDetails = { description: 'Fix broken screen', type: 'Repair', assignedTeam: 'Tech Team' };
  const changeRequestId = 'change-123';
  const userId = 'user-123';
  const description = 'Some change request';

  beforeEach(() => {
    // Clear the event store and todo list, and initialize the processor before each test
    jobEventStore.clear();
    todoList.length = 0;
    initializeToDoJobToAssessChangeRequest();

    // Create and store a JobCreated event to simulate an existing job with status 'Pending'
    const jobCreatedEvent = JobCreatedEvent(jobId, customerId, requestId, quotationId, jobDetails, 'Pending');
    jobEventStore.append(jobCreatedEvent);

    // Add a todo item with status TO_BE_ASSESSED to simulate an existing item
    const eventId = 'event-123';
    updateTodoList(eventId, TODO_STATUS.TO_BE_ASSESSED, jobId, changeRequestId, userId, description);

    // Log the initial state for verification
    console.log('[Test Setup] Initial Todo List:', todoList);
  });

  it('should update the todo list item status to ASSESSED when processed', (done) => {
    jest.setTimeout(10000); // Increase timeout to 10 seconds

    // Subscribe to the event that indicates the todo item has been processed
    eventBus.subscribe('TodoListUpdated', (event) => {
      try {
        console.log('[Test] Received TodoListUpdated event:', event);

        // Reconstruct the job state to ensure it is 'Pending'
        const job = reconstructJobState(jobId);
        console.log('[Test] Reconstructed Job State:', job);

        // Verify the job status is now "OnHold"
        expect(job.status).toBe('OnHold');

        // Check the todoList directly to verify the status change
        const todoItem = todoList.find(item => item.changeRequestId === changeRequestId);
        console.log('[Test] Found Todo Item:', todoItem);

        // Verify the todo item status is updated to ASSESSED
        expect(todoItem).toBeDefined();
        expect(todoItem.track).toBe(TODO_STATUS.ASSESSED);

        done(); // Notify that the test is complete
      } catch (error) {
        done(error); // If there's an error, notify with the error
      }
    });

    // Simulate the processing of the todo item by publishing the event
    const jobAssignedEvent = JobAssignedToChangeRequestEvent(jobId, changeRequestId, userId, description);
    console.log('[Test] Publishing JobAssignedToChangeRequest event:', jobAssignedEvent);
    eventBus.publish(jobAssignedEvent);
    console.log('[Test] Event published, waiting for subscription to process...');
  });
});

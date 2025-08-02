// Import necessary modules and functions
import { initializeToDoJobToAssessChangeRequest } from '../domain/features/98_AssignJobToChangeRequestProcessor/initializeAssigToDoJobToAssessChangeRequestProcessor';
import { eventBus } from '../domain/core/eventBus';
import { jobEventStore } from '../domain/core/eventStore';
import { JobAssignedToChangeRequestEvent } from '../domain/events/JobAssignedToChangeRequestEvent';
import { JobCreatedEvent } from '../domain/events/jobCreatedEvent';
import { TODO_STATUS, todoList, updateTodoList } from '../domain/features/99_changeRequestToJobReactionProcessor/todoListManager';
import { reconstructJobState } from '../domain/entities/Job/aggregate'; // Adjust the import path as needed
import { JobStartedEvent } from '../domain/events/jobStartedEvent';
import { JobCompletedEvent } from '../domain/events/jobCompletedEvent';

describe('To-Do List Processing - Completed Status Scenario', () => {
  const jobId = 'job-123';
  const customerId = 'customer-123';
  const requestId = 'req-123';
  const quotationId = 'quotation-123';
  const jobDetails = { description: 'Fix broken screen', type: 'Repair', assignedTeam: 'Tech Team' };
  const changeRequestId = 'change-123';
  const userId = 'user-123';
  const description = 'Some change request';

  beforeEach(() => {
    jobEventStore.clear();
    todoList.length = 0;
    initializeToDoJobToAssessChangeRequest();

    // Create and store a JobCreated event to simulate an existing job
    const jobCreatedEvent = JobCreatedEvent(jobId, customerId, requestId, quotationId, jobDetails, 'Pending');
    jobEventStore.append(jobCreatedEvent);

    // Create and store a JobStarted event to transition the job to 'Started'
    const jobStartedEvent = JobStartedEvent(jobId, requestId, jobDetails.assignedTeam, userId);
    jobEventStore.append(jobStartedEvent);

    // Create and store a JobCompleted event to transition the job to 'Completed'
    const jobCompletedEvent = JobCompletedEvent(jobId, requestId, userId, { details: 'Job completed successfully' });
    jobEventStore.append(jobCompletedEvent);

    // Add a todo item with status 'No'
    const eventId = 'event-123';
    updateTodoList(eventId, TODO_STATUS.TO_BE_ASSESSED, jobId, changeRequestId, userId, description);
  });

  it('should reject the change request and update the todo list item status to TO_BE_ASSESSED', (done) => {
    eventBus.subscribe('TodoListUpdated', (event) => {
      try {
        const job = reconstructJobState(jobId);
        expect(job.status).toBe('Completed');

        const todoItem = todoList.find(item => item.changeRequestId === changeRequestId);
        expect(todoItem.track).toBe(TODO_STATUS.ASSESSED);

        done();
      } catch (error) {
        done(error);
      }
    });

    const jobAssignedEvent = JobAssignedToChangeRequestEvent(jobId, changeRequestId, userId, description);
    eventBus.publish(jobAssignedEvent);
  });
});
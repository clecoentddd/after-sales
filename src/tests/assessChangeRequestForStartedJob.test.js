import { initializeToDoJobToAssessChangeRequest } from '../domain/features/98_AssignJobToChangeRequestProcessor/initializeAssignToDoJobToAssessChangeRequestProcessor';
import { eventBus } from '../domain/core/eventBus';
import { jobEventStore } from '../domain/core/eventStore';
import { StartedJobAssignedToChangeRequestEvent } from '../domain/features/99_changeRequestToJobReactionProcessor/StartedJobAssignedToChangeRequestEvent';
import { JobCreatedEvent } from '../domain/events/jobCreatedEvent';
import { TODO_STATUS, todoList, updateTodoList } from '../domain/features/99_changeRequestToJobReactionProcessor/todoListManager';
import { reconstructJobState } from '../domain/entities/Job/aggregate'; // Adjust the import path as needed
import { JobStartedEvent } from '../domain/events/jobStartedEvent'; // Import the JobStartedEvent

describe('To-Do List Processing - Started Status Scenario', () => {
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

    // Add a todo item with status 'No'
    const eventId = 'event-123';
    updateTodoList(eventId, TODO_STATUS.TO_BE_ASSESSED, jobId, changeRequestId, userId, description);
  });

  it('should flag the job for assessment and update the todo list item status to "TO_BE_ASSESSED"', (done) => {
    eventBus.subscribe('TodoListUpdated', (event) => {
      try {
        const job = reconstructJobState(jobId);
        expect(job.status).toBe('ChangeRequestReceivedPendingAssessment');

        const todoItem = todoList.find(item => item.changeRequestId === changeRequestId);
        expect(todoItem.track).toBe(TODO_STATUS.ASSESSMENT_TO_BE_PROVIDED);

        done();
      } catch (error) {
        done(error);
      }
    });

    const jobAssignedEvent = StartedJobAssignedToChangeRequestEvent(jobId, changeRequestId, userId, description);
    eventBus.publish(jobAssignedEvent);
  });
});

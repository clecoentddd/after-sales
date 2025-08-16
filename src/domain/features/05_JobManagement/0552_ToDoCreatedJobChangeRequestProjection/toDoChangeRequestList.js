import { getAllEvents } from '@core/eventStoreUtils';

let todoList = [];


export const buildTodoList = () => {
  const allEvents = getAllEvents()
    .filter((event) =>
      [
        'ChangeRequestRaised',
        'ChangeRequestJobAssigned',
        'ChangeRequestJobAssignmentFailed',
        'JobOnHold',
        'JobChangeRequestRejected',
        'ChangeRequestReceivedPendingAssessment',
      ].includes(event.type)
    )
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // oldest first

  console.log('[DEBUG] All filtered events:', allEvents);

  todoList = [];
  const changeRequestMap = {};

  allEvents.forEach((event) => {
    const changeRequestId = event.changeRequestId || event.data?.changeRequestId;

    if (event.type === 'ChangeRequestRaised') {
      const entry = {
        requestId: event.aggregateId,
        changeRequestId: event.changeRequestId,
        jobId: 'Not defined yet',
        assignmentStatus: 'Waiting',
        processStatus: 'To Process', // <-- New field
        timestamp: event.timestamp,
        events: [event],
      };
      todoList.push(entry);
      changeRequestMap[event.changeRequestId] = entry;
    } else {
      const entry = changeRequestMap[changeRequestId];
      if (!entry) {
        console.warn('[DEBUG] No entry found for event:', event.type, changeRequestId);
        return;
      }

      entry.events.push(event);

      if (event.type === 'ChangeRequestJobAssigned') {
        entry.jobId =event.aggregateId;
        entry.assignmentStatus = 'Job Assigned to CR'; // jobId as status
        entry.processStatus = 'To Process'; // still to process until JobOnHold
      } else if (event.type === 'ChangeRequestJobAssignmentFailed') {
        entry.assignmentStatus = 'Failed to find a job with correct requestId';
        entry.processStatus = 'To Process';
      } else if (event.type === 'JobOnHold') {
        // Mark as processed successfully
        entry.processStatus = 'Processed Successfully (OnHold)';
      } else if (event.type === 'ChangeRequestReceivedPendingAssessment') {
        // Mark as processed successfully
        entry.processStatus = 'Processed Successfully (To be assessed)';
      } else if (event.type === 'JobChangeRequestRejected') {
        // Mark as processed successfully
        entry.processStatus = 'Processed Successfully (Rejected)';
      }
    }
  });

  // Sort by timestamp (newest first)
  todoList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  console.log('[DEBUG] Final todoList:', todoList);

  return todoList;
};

// Update with new events
export const updateTodoList = (event) => {
  if (
    ['ChangeRequestRaised', 
      'ChangeRequestJobAssigned', 
      'ChangeRequestJobAssignmentFailed', 
      'JobOnHold',
      'JobChangeRequestRejected',
      'ChangeRequestReceivedPendingAssessment'
    ].includes(
      event.type
    )
  ) {
    buildTodoList();
  }
};

// Get the current todo list
export const getChangeRequestTodoList = () => todoList;

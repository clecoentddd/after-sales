import { getAllEvents } from '@core/eventStoreUtils';

let todoList = [];

// Helper: Get the latest timestamp for a group of events
const getLatestTimestamp = (events) => {
  return events.reduce(
    (latest, event) =>
      new Date(event.timestamp) > new Date(latest)
        ? event.timestamp
        : latest,
    events[0]?.timestamp
  );
};

// Helper: Determine assignment status for a change request
const getAssignmentStatus = (events) => {
  const assignedEvent = events.find(
    (e) => e.type === 'ChangeRequestJobAssigned'
  );
  if (assignedEvent) return assignedEvent.aggregateId; // jobId as status

  const failedEvent = events.find(
    (e) => e.type === 'ChangeRequestJobAssignmentFailed'
  );
  if (failedEvent) return 'Failed';

  return 'Waiting';
};

export const buildTodoList = () => {
  const allEvents = getAllEvents()
    .filter((event) =>
      [
        'ChangeRequestRaised',
        'ChangeRequestJobAssigned',
        'ChangeRequestJobAssignmentFailed',
        'JobOnHold', // <-- Include JobOnHold events
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
        entry.assignmentStatus = event.aggregateId; // jobId as status
        entry.processStatus = 'To Process'; // still to process until JobOnHold
      } else if (event.type === 'ChangeRequestJobAssignmentFailed') {
        entry.assignmentStatus = 'Failed';
        entry.processStatus = 'To Process';
      } else if (event.type === 'JobOnHold') {
        // Mark as processed successfully
        entry.processStatus = 'Processed Successfully';
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
    ['ChangeRequestRaised', 'ChangeRequestJobAssigned', 'ChangeRequestJobAssignmentFailed', 'JobOnHold'].includes(
      event.type
    )
  ) {
    buildTodoList();
  }
};

// Get the current todo list
export const getChangeRequestTodoList = () => todoList;

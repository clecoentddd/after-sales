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
      ].includes(event.type)
    )
    .sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    ); // Sort by timestamp (oldest first)

  console.log('[DEBUG] All filtered events:', allEvents);

  todoList = []; // Reset the global todoList
  const changeRequestMap = {}; // Map to track entries by changeRequestId

  allEvents.forEach((event) => {
    console.log(
      '[DEBUG] Processing event:',
      event.type,
      event.changeRequestId || event.data?.changeRequestId
    );

    if (event.type === 'ChangeRequestRaised') {
      const entry = {
        requestId: event.aggregateId,
        changeRequestId: event.changeRequestId,
        assignmentStatus: 'Waiting',
        timestamp: event.timestamp,
        events: [event],
      };
      todoList.push(entry);
      changeRequestMap[event.changeRequestId] = entry;
      console.log(
        '[DEBUG] Created entry for ChangeRequestRaised:',
        entry
      );
    }
    else if (event.type === 'ChangeRequestJobAssigned') {
      const changeRequestId = event.data?.changeRequestId;
      const entry = changeRequestMap[changeRequestId];
      if (entry) {
        entry.assignmentStatus = event.aggregateId; // Set jobId as status
        entry.events.push(event);
        console.log(
          '[DEBUG] Updated entry with jobId:',
          entry.assignmentStatus
        );
      } else {
        console.warn(
          '[DEBUG] No entry found for ChangeRequestJobAssigned:',
          changeRequestId
        );
      }
    }
    else if (event.type === 'ChangeRequestJobAssignmentFailed') {
      const changeRequestId = event.data?.changeRequestId;
      const entry = changeRequestMap[changeRequestId];
      if (entry) {
        entry.assignmentStatus = 'Failed';
        entry.events.push(event);
        console.log(
          '[DEBUG] Updated entry with failure status'
        );
      } else {
        console.warn(
          '[DEBUG] No entry found for ChangeRequestJobAssignmentFailed:',
          changeRequestId
        );
      }
    }
  }); // <-- forEach loop closed here

  console.log('[DEBUG] Final todoList:', todoList);

  // Sort by timestamp (newest first)
  todoList.sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return todoList;
};

// Update with a new event
export const updateTodoList = (event) => {
  if (
    event.type === 'ChangeRequestRaised' ||
    event.type === 'ChangeRequestJobAssigned' ||
    event.type === 'ChangeRequestJobAssignmentFailed'
  ) {
    buildTodoList();
  }
};

// Get the current todo list
export const getChangeRequestTodoList = () => todoList;

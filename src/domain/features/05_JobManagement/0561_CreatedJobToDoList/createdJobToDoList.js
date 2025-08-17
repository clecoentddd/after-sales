import { getAllEvents } from '@core/eventStoreUtils';

let todoList = [];

export const buildTodoList = () => {
  const allEvents = getAllEvents()
    .filter((event) =>
      ['CreatedJobAssignedToChangeRequest', 'JobOnHold'].includes(event.type)
    )
    .sort((a, b) => new Date(a.metadata.timestamp) - new Date(b.metadata.timestamp)); // oldest first

  console.log('[DEBUG] All filtered events:', allEvents);

  todoList = [];
  const changeRequestMap = {};

  allEvents.forEach((event) => {
    const changeRequestId = event.changeRequestId || event.data?.changeRequestId;

    if (event.type === 'CreatedJobAssignedToChangeRequest') {
      const entry = {
        requestId: event.requestId,
        changeRequestId,
        jobId: event.aggregateId,
        processStatus: 'To Process',
        timestamp: event.metadata.timestamp,
        events: [event],
      };
      todoList.push(entry);
      changeRequestMap[changeRequestId] = entry;
    } else if (event.type === 'JobOnHold') {
      const entry = changeRequestMap[changeRequestId];
      if (!entry) {
        console.warn('[DEBUG] No entry found for JobOnHold event:', changeRequestId);
        return;
      }
      entry.events.push(event);
      entry.processStatus = 'Processed Successfully (OnHold)';
    }
  });

  // Sort by timestamp (newest first)
  todoList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  console.log('[DEBUG] Final todoList:', todoList);

  return todoList;
};

// Update with new events
export const updateTodoList = (event) => {
  if (['CreatedJobAssignedToChangeRequest', 'JobOnHold'].includes(event.type)) {
    buildTodoList();
  }
};

// Get the current todo list
export const getChangeRequestTodoList = () => todoList;

import { invoiceEventStore } from '@core/eventStore';

// Declare and initialize the live model state
let liveModelState = {};

// Function to build the live model by replaying events
export const buildLiveModel = () => {
  console.log('[ToDoModel] Building live model from event store...');

  // Retrieve all events from the invoiceEventStore where aggregateType is 'InvoiceToDo'
  const invoiceToDoEvents = invoiceEventStore.getEvents()
    .filter(event => event.aggregateType === 'InvoiceToDo');

  console.log(`[ToDoModel] Found ${invoiceToDoEvents.length} InvoiceToDo events to replay`);
  
  // Log each event to see its details
invoiceToDoEvents.forEach((event, index) => {
  console.log(`Event ${index + 1}:`, {
    type: event.type,
    aggregateId: event.aggregateId,
    data: event.data,
    timestamp: event.timestamp
  });
});

  // Initialize a temporary state to compute the current status
  const tempLiveModelState = {};

  // Replay events to build the current state
  invoiceToDoEvents.forEach(event => {
    const { aggregateId, type, data } = event;

    if (type === 'invoiceToRaiseToDoItemAdded') {
      if (!tempLiveModelState[aggregateId]) {
        tempLiveModelState[aggregateId] = {
          aggregateId,
          jobId: data.jobId, // Include jobId from the event data
          ToDoComplete: false
        };
      }
    } else if (type === 'invoiceToRaiseToDoItemClosed') {
      if (tempLiveModelState[aggregateId]) {
        tempLiveModelState[aggregateId].ToDoComplete = true;
      }
    }
  });

  // Update the global live model state
  liveModelState = tempLiveModelState;

  // Extract IDs of incomplete to-do items
  const incompleteToDoIds = Object.keys(liveModelState)
    .filter(aggregateId => !liveModelState[aggregateId].ToDoComplete);

  console.log(`[ToDoModel] Found ${incompleteToDoIds.length} incomplete todo items`);
  return incompleteToDoIds;
};

// Function to query all to-do items from the live model
export const queryToDosProjection = () => {
  const allItems = Object.entries(liveModelState).map(([aggregateId, toDoItem]) => ({
    aggregateId,
    ...toDoItem
  }));

  console.log(`[ToDoModel] Retrieved all ${allItems.length} todo items from projection`);
  return allItems;
};

// Function to clear all to-do items from the live model
export const clearToDos = () => {
  const itemCount = Object.keys(liveModelState).length;
  console.log(`[ToDoModel] Clearing ${itemCount} todo items from live model`);

  liveModelState = {};

  console.log('[ToDoModel] Live model cleared');
};

import { eventBus } from './your-event-bus'; // Replace with your actual eventBus import

let todoList = [];
const changeRequestMap = {}; // Tracks entries by changeRequestId

// Initialize or rebuild the projection
export const buildTodoListOfCRsToAssess = () => {
  const allEvents = getAllEvents()
    .filter((event) =>
      ['jobCreated', 'jobStarted', 'jobCompleted', 'jobChangeRequestAssigned'].includes(event.type)
    )
    .sort((a, b) => new Date(a.metadata.timestamp) - new Date(b.metadata.timestamp));

  todoList = [];
  changeRequestMap = {};

  allEvents.forEach(handleEvent);

  // Sort by most recent event timestamp (newest first)
  todoList = Object.values(changeRequestMap)
    .sort((a, b) => new Date(b.events[b.events.length - 1].metadata.timestamp) - new Date(a.events[a.events.length - 1].metadata.timestamp));

  return todoList;
};

// Handle a single event (for live updates)
export const updateTodoList = (event) => {
  if (!['jobCreated', 'jobStarted', 'jobCompleted', 'jobChangeRequestAssigned'].includes(event.type)) {
    return;
  }

  handleEvent(event);

  // Update the sorted todoList
  todoList = Object.values(changeRequestMap)
    .sort((a, b) => new Date(b.events[b.events.length - 1].metadata.timestamp) - new Date(a.events[a.events.length - 1].metadata.timestamp));
};

// Get the current todo list
export const getChangeRequestTodoList = () => todoList;

// --- Event Handlers ---
const handleEvent = (event) => {
  const { jobId, changeRequestId, requestId } = event.data || event;
  let entry = changeRequestMap[changeRequestId];

  if (!entry) {
    entry = {
      jobId,
      changeRequestId,
      jobStatus: 'Created',
      requestId: requestId || null,
      events: [],
      processed: false,
    };
    changeRequestMap[changeRequestId] = entry;
  }

  entry.events.push(event);

  // Update job status
  if (event.type === 'jobCreated') {
    entry.jobStatus = 'Created';
  } else if (event.type === 'jobStarted') {
    entry.jobStatus = 'Started';
  } else if (event.type === 'jobCompleted') {
    entry.jobStatus = 'Completed';
  } else if (event.type === 'jobChangeRequestAssigned') {
    entry.jobStatus = 'Assigned';
    entry.requestId = requestId;

    // Publish synthetic event only once per change request
    if (!entry.processed) {
      publishSyntheticEvent('ChangeRequestReadyToProcess', {
        jobId,
        changeRequestId,
        jobStatus: entry.jobStatus,
      });
      entry.processed = true;
    }
  }
};

// Publish synthetic event (replace with your actual publisher)
const publishSyntheticEvent = (type, data) => {
  console.log('[SYNTHETIC EVENT]', type, data);
  eventBus.publish(type, data); // Publish to the bus if needed
};

// --- Startup ---
buildTodoListOfCRsToAssess(); // Load historical events
// Subscribe to live events
eventBus.subscribe('jobCreated', updateTodoList);
eventBus.subscribe('jobStarted', updateTodoList);
eventBus.subscribe('jobCompleted', updateTodoList);
eventBus.subscribe('JobAssignedToChangeRequest', updateTodoList);

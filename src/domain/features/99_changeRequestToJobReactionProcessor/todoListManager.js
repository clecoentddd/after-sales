// src/domain/features/99_changeRequestToJobReactionProcessor/todoListManager.js

// Define status constants within the same file
export const TODO_STATUS = {
  TO_BE_ASSESSED: 'ToBeAssessed',
  ASSESSED: 'Assessed',
  ASSESSMENT_TO_BE_PROVIDED: 'AssessmentToBeProvided',
  ERROR_NO_JOB: 'ErrorNoJob'
};

let todoList = [];

export const updateTodoList = (eventId, status, jobId = null, changeRequestId = null, changedByUserId = null, description = null) => {
  const index = todoList.findIndex(item => item.eventId === eventId);
  if (index !== -1) {
    todoList[index].track = status;
  } else {
    todoList.push({ eventId, track: status, jobId, changeRequestId, changedByUserId, description });
  }
};

// Assuming todoList is accessible or can be retrieved from a store or context
export const getTodoList = () => {
  // Replace this with actual logic to retrieve the todo list
  return todoList;
};

// Export the todoList as well if needed
export { todoList };

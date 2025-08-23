let toDoDB = [];

export const getToDoDB = () => {
  console.log("[getToDoDB] Retrieving current toDoDB state");
  return [...toDoDB];
};

export const clearToDoDB = () => {
  console.log("[clearToDoDB] Clearing toDoDB");
  toDoDB = [];
  console.log("[clearToDoDB] toDoDB cleared");
};

export const addToDo = (todo) => {
  console.log("[addToDo] Adding todo:", {
    changeRequestId: todo.changeRequestId,
    jobId: todo.jobId,
    flag: "todo"
  });
  toDoDB.push({
    changeRequestId: todo.changeRequestId,
    jobId: todo.jobId,
    flag: "todo"
  });
  console.log("[addToDo] Todo added. Current toDoDB length:", toDoDB.length);
};

export const updateToDo = (changeRequestId, updates) => {
  console.log("[updateToDo] Updating todo with changeRequestId:", changeRequestId, "Updates:", updates);
  const index = toDoDB.findIndex(t => t.changeRequestId === changeRequestId);
  if (index >= 0) {
    toDoDB[index] = { ...toDoDB[index], ...updates };
    console.log("[updateToDo] Todo updated successfully");
  } else {
    console.warn("[updateToDo] No todo found with changeRequestId:", changeRequestId);
  }
};

export const queryChangeRequestToProcess = () => {
  console.log("[queryChangeRequestToProcess] Querying todos with flag 'todo'");
  const result = toDoDB.filter(todo => todo.flag === "todo");
  console.log("[queryChangeRequestToProcess] Found", result.length, "todos to process");
  return result;
};

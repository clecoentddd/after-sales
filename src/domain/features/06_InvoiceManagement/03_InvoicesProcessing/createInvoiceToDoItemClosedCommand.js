export const createCloseInvoiceToDoItemCommand = (todo) => ({
  type: 'CloseInvoiceToDoItem',
  aggregateId: todo.aggregateId,
  requestId: todo.requestId,
  changeRequestId: todo.changeRequestId,
  dataPayload: todo.payload, // Pass the entire payload
  timestamp: new Date().toISOString()
});
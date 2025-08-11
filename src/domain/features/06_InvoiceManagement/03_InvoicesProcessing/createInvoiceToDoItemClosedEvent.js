export const createInvoiceToDoItemClosedEvent = (aggregateId, data = {}) => ({
  type: 'invoiceToRaiseToDoItemClosed',
  aggregateId,
  aggregateType: 'InvoiceToDo',
  data: {
    ToDoComplete: true,
    completedAt: new Date().toISOString(),
  },
  metadata: {
    timestamp: new Date().toISOString(),
  },
});
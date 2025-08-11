export const createInvoiceToDoItemAddedEvent = (aggregateId, sourceEvent) => ({
  type: 'invoiceToRaiseToDoItemAdded',
  aggregateId,
  aggregateType: 'InvoiceToDo',
  data: {
    jobId: sourceEvent.aggregateId,
    payload: sourceEvent.data,
    ToDoComplete: false,
  },
  metadata: {
    timestamp: new Date().toISOString(),
  },
});
export const createInvoiceToDoItemAddedEvent = (aggregateId, sourceEvent) => ({
  type: 'invoiceToRaiseToDoItemAdded',
  aggregateId,
  aggregateType: 'InvoiceToDo',
  data: {
    jobId: sourceEvent.aggregateId,
    payload: sourceEvent.data,
    toDoComplete: false,
  },
  metadata: {
    timestamp: new Date().toISOString(),
  },
});
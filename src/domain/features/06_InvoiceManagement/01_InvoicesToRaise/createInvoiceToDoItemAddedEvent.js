export const createInvoiceToDoItemAddedEvent = (aggregateId, sourceEvent) => ({
  type: 'invoiceToRaiseToDoItemAdded',
  aggregateId,
  aggregateType: 'InvoiceToDo',
  requestId: sourceEvent.requestId,
  changeRequestId: sourceEvent.changeRequestId,
  data: {
    jobId: sourceEvent.aggregateId,
    payload: sourceEvent.data,
    toDoComplete: false,
  },
  metadata: {
    timestamp: new Date().toISOString(),
  },
});
export const createInvoiceToDoItemFailedEvent = (aggregateId, requestId, changeRequestId, data = {}) => ({
  type: 'invoiceToRaiseToDoItemFailed',
  aggregateId,
  aggregateType: 'InvoiceToDo',
  requestId: requestId,
  changeRequestId: changeRequestId,
  data: {
    toDoComplete: "failed",
    dataMissing: data.dataMissing,
    completedAt: new Date().toISOString(),
  },
  metadata: {
    timestamp: new Date().toISOString(),
  },
});
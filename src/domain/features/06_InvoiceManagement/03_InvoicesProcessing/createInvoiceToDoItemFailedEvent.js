export const createInvoiceToDoItemFailedEvent = (aggregateId, data = {}) => ({
  type: 'invoiceToRaiseToDoItemFailed',
  aggregateId,
  aggregateType: 'InvoiceToDo',
  data: {
    toDoComplete: "failed",
    dataMissing: data.dataMissing,
    completedAt: new Date().toISOString(),
  },
  metadata: {
    timestamp: new Date().toISOString(),
  },
});
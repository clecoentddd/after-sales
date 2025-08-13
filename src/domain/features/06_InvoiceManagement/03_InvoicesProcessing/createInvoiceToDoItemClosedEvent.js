export const createInvoiceToDoItemClosedEvent = (command) => ({
  type: 'invoiceToRaiseToDoItemClosed',
  aggregateId: command.aggregateId,
  aggregateType: 'InvoiceToDo',
  requestId: command.requestId,
  changeRequestId: command.changeRequestId,
  data: {
    toDoComplete: true,
    completedAt: new Date().toISOString(),
    // You can include additional data from the command if needed
    ...(command.dataPayload && { payload: command.dataPayload })
  },
  metadata: {
    timestamp: new Date().toISOString(),
  },
});
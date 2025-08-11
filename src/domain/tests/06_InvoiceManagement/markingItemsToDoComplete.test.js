import { buildLiveModel } from '../../features/00_InvoiceManagement/02_ProjectionRaisingInvoicesToDo/liveModel';
import { createInvoiceToDoItemAddedEvent } from '../../features/00_InvoiceManagement/01_InvoicesToRaise/createInvoiceToDoItemAddedEvent';
import { initializeInvoiceProcessHandler } from '../../features/00_InvoiceManagement/03_InvoicesProcessing/toDoProcessor';
import { createInvoiceToDoItemClosedEvent } from '../../features/00_InvoiceManagement/03_InvoicesProcessing/createInvoiceToDoItemClosedEvent';
import { eventBus } from '@core/eventBus';
import { invoiceEventStore } from '@core/eventStore';
import { clearToDos, queryToDosProjection, getIncompleteToDoItems } from '../../features/00_InvoiceManagement/02_ProjectionRaisingInvoicesToDo/liveModel';
import { v4 as uuidv4 } from 'uuid';


describe('Todo Item Completion', () => {
  beforeEach(() => {
    clearToDos();
    invoiceEventStore.clear();
    buildLiveModel();
    initializeInvoiceProcessHandler();
  });

  test('should mark todo as complete when processor handles invoiceToRaiseToDoItemAdded', async () => {
    const todoId = uuidv4();
    
    // Mock source event
    const mockJobEvent = {
      aggregateId: 'job123',
      type: 'JobHasBeenCompleted',
      data: { 
        jobId: 'job123',
        quotationId: 'quote456',
        customerId: 'cust789',
        requestId: 'req101',
        amount: 1000,
        currency: 'USD',
        description: 'Test Job'
      }
    };

    // 1. Create todo event with ToDoComplete: false
    const todoAddedEvent = createInvoiceToDoItemAddedEvent(todoId, mockJobEvent);
    
    // Verify the event is created with ToDoComplete: false
    expect(todoAddedEvent.data.ToDoComplete).toBe(false);
    
    // 2. Append and publish the todo event - this triggers the processor
    invoiceEventStore.append(todoAddedEvent);
    eventBus.publish(todoAddedEvent);
    
    // Wait for the processor to handle the event
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 3. Rebuild model to see the processor's changes
    buildLiveModel();
    
    // 4. Verify todo is now marked complete by the processor
    const todos = queryToDosProjection();
    expect(todos).toHaveLength(1);
    expect(todos[0].ToDoComplete).toBe(true);
    
    // Verify the processor created a close event
    const allEvents = invoiceEventStore.getEvents();
    const closeEvents = allEvents.filter(e => e.type === 'invoiceToRaiseToDoItemClosed');
    expect(closeEvents).toHaveLength(1);
    expect(closeEvents[0].data.ToDoComplete).toBe(true);
    
    console.log(`[Test] Todo ${todoId} automatically completed by processor`);
  });
});
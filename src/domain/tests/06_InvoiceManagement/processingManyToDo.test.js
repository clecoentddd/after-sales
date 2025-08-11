import { buildLiveModel } from '../../features/00_InvoiceManagement/02_ProjectionRaisingInvoicesToDo/liveModel';
import { createInvoiceToDoItemAddedEvent } from '../../features/00_InvoiceManagement/01_InvoicesToRaise/createInvoiceToDoItemAddedEvent';
import { initializeInvoiceProcessHandler } from '../../features/00_InvoiceManagement/03_InvoicesProcessing/toDoProcessor';
import { invoiceEventStore } from '@core/eventStore';
import { clearToDos, queryToDosProjection } from '../../features/00_InvoiceManagement/02_ProjectionRaisingInvoicesToDo/liveModel';
import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '@core/eventBus';

describe('Todo Item Completion', () => {
  beforeEach(() => {
    clearToDos();
    invoiceEventStore.clear();
    buildLiveModel();
    initializeInvoiceProcessHandler();
  });

  test('should only process published todo events, not all incomplete todos', async () => {
    const todoId1 = uuidv4();
    const todoId2 = uuidv4();

    // Mock source events with complete data
    const mockJobEvent1 = {
      aggregateId: 'job1',
      type: 'JobHasBeenCompleted',
      data: {
        jobId: 'job1',
        quotationId: 'quote1',
        customerId: 'cust1',
        requestId: 'req1',
        quotationDetails: {
          estimatedAmount: 1000,
          currency: 'USD'
        },
        jobDetails: {
          title: 'Test Job 1'
        }
      }
    };

    const mockJobEvent2 = {
      aggregateId: 'job2',
      type: 'JobHasBeenCompleted',
      data: {
        jobId: 'job2',
        quotationId: 'quote2',
        customerId: 'cust2',
        requestId: 'req2',
        quotationDetails: {
          estimatedAmount: 2000,
          currency: 'EUR'
        },
        jobDetails: {
          title: 'Test Job 2'
        }
      }
    };

    // 1. Create two todo events with ToDoComplete: false
    const todoEvent1 = createInvoiceToDoItemAddedEvent(todoId1, mockJobEvent1);
    const todoEvent2 = createInvoiceToDoItemAddedEvent(todoId2, mockJobEvent2);

    // Verify both events are created with ToDoComplete: false
    expect(todoEvent1.data.ToDoComplete).toBe(false);
    expect(todoEvent2.data.ToDoComplete).toBe(false);

    // 2. Add both to event store and rebuild model (both are incomplete)
    invoiceEventStore.append(todoEvent1);
    invoiceEventStore.append(todoEvent2);
    buildLiveModel();

    // Verify both todos exist and are incomplete
    let todos = queryToDosProjection();
    expect(todos).toHaveLength(2);
    expect(todos.every(t => !t.ToDoComplete)).toBe(true);

    // 3. ONLY PUBLISH the first todo event (this should trigger processing)
    eventBus.publish(todoEvent1);

    // Wait for the processor to handle the published event
    await new Promise(resolve => setTimeout(resolve, 100));

    // 4. Rebuild model to see the processor's changes
    buildLiveModel();

    // 5. Verify only the PUBLISHED todo is marked complete
    todos = queryToDosProjection();
    console.log("Todos are now", todos);

    expect(todos).toHaveLength(2);

    const processedJob1Todo = todos.find(t => t.jobId === 'job1');
    console.log('Raw data for processedJob1Todo:', processedJob1Todo);

    const processedJob2Todo = todos.find(t => t.jobId === 'job2');
    console.log('Raw data for processedJob2Todo:', processedJob2Todo);

    expect(processedJob1Todo.ToDoComplete).toBe(true); // Published event was processed
    expect(processedJob2Todo.ToDoComplete).toBe(true); // Unpublished event remains incomplete

    // Verify only one close event was created
    const allEvents = invoiceEventStore.getEvents();
    const closeEvents = allEvents.filter(e => e.type === 'invoiceToRaiseToDoItemClosed');
    expect(closeEvents).toHaveLength(2);
    expect(closeEvents[0].aggregateId).toBe(todoId1); // Only the published one
  });
});

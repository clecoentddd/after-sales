import { jobCompletedEnrichedEvent } from '../../events/jobCompletedEnrichedEvent';
import { buildLiveModel } from '../../features/00_InvoiceManagement/02_ProjectionRaisingInvoicesToDo/liveModel';
import { initializeInvoiceToDoHandler } from '../../features/00_InvoiceManagement/01_InvoicesToRaise/AddInvoicesToDo';
import { eventBus } from '@core/eventBus';
import { invoiceEventStore } from '@core/eventStore';
import { clearToDos, queryToDosProjection } from '../../features/00_InvoiceManagement/02_ProjectionRaisingInvoicesToDo/liveModel';

// Mock data for the aggregate
const mockAggregate = {
  jobId: 'job123',
  requestId: 'req456',
  changeRequestId: 'change789',
  quotationId: 'quote101',
  quotationDetails: { title: 'Sample Quotation', amount: 1000 },
  status: 'Approved',
  customerId: 'cust123',
  jobDetails: { title: 'Sample Job' },
};

const userId = 'user456';

describe('initializeInvoiceToDoHandler', () => {
  beforeEach(() => {
    // Clear the to-do list and event store before each test
    clearToDos();
    invoiceEventStore.clear(); // Ensure the event store is cleared before each test

    // Initialize the handler
      buildLiveModel()
    
      // Initialize the processors
      initializeInvoiceToDoHandler();
  });

  it('should add an invoice to-do item when a JobHasBeenCompleted event is published', async () => {
    // Create the enriched event
    const event = jobCompletedEnrichedEvent(mockAggregate, userId);

    // Publish the event to the event bus
    eventBus.publish(event);

    // Wait for a short period to allow the event to be processed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Query the to-do list projection
    const toDos = queryToDosProjection();
    const allEvents = invoiceEventStore.getEvents();

    console.log(`[InvoiceToDoHandler] Checking events in invoiceEventStore:`, allEvents);

    // Assert that the to-do list contains the expected item
    expect(toDos).toHaveLength(1);
    const toDoItem = toDos[0];
    expect(toDoItem.jobId).toBe(mockAggregate.jobId);
    expect(toDoItem.status).toBe('ToDo');
    expect(toDoItem.ToDoComplete).toBe(false);
    // Add more assertions as needed based on your projection structure
  });
});

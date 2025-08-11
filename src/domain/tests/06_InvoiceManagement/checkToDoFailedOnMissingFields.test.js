import { buildLiveModel } from '../../features/06_InvoiceManagement/02_ProjectionRaisingInvoicesToDo/liveModel';
import { createInvoiceToDoItemAddedEvent } from '../../features/06_InvoiceManagement/01_InvoicesToRaise/createInvoiceToDoItemAddedEvent';
import { initializeInvoiceProcessHandler } from '../../features/06_InvoiceManagement/03_InvoicesProcessing/toDoProcessor';
import { invoiceEventStore } from '@core/eventStore';
import { clearToDos } from '../../features/06_InvoiceManagement/02_ProjectionRaisingInvoicesToDo/liveModel';
import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '@core/eventBus';

describe('Invoice Processing', () => {
  beforeEach(() => {
    clearToDos();
    invoiceEventStore.clear();
    buildLiveModel();
    initializeInvoiceProcessHandler();
  });

  test('should fail processing a todo item due to missing data and check the failed event', async () => {
    const todoId = uuidv4();

    // Mock source event with missing currency data
    const mockJobEvent = {
      aggregateId: 'job1',
      type: 'JobHasBeenCompleted',
      data: {
        jobId: 'job1',
        quotationId: 'quote1',
        customerId: 'cust1',
        requestId: 'req1',
        quotationDetails: {
          estimatedAmount: 1000,
          // currency is intentionally missing
        },
        details: {
          title: 'Test Job 1'
        }
      }
    };

    // Create and append a todo event with toDoComplete: false
    const todoEvent = createInvoiceToDoItemAddedEvent(todoId, mockJobEvent);
    invoiceEventStore.append(todoEvent);

    // Publish the event to trigger processing
    eventBus.publish(todoEvent);

    // Wait for the event to be processed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Retrieve all events from the event store
    const allEvents = invoiceEventStore.getEvents();

    // Log the events with full details
    console.log('All events from invoiceStore:', JSON.stringify(allEvents, null, 2));

    // Verify that an invoiceToDoItemFailedEvent was created due to missing data
    const failedEvents = allEvents.filter(e => e.type === 'invoiceToRaiseToDoItemFailed');
    expect(failedEvents).toHaveLength(1);

    const failedEvent = failedEvents[0];
    expect(failedEvent.data.dataMissing).toContain('currency');

    console.log('[Test] Successfully verified that todo item processing failed due to missing data');
  });
});

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

test('should process an added todo item and check the InvoiceRaised event', async () => {
  const todoId = uuidv4();

  // Mock source event with complete data
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
        currency: 'USD'
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

  const invoiceRaisedEvents = allEvents.filter(e => e.type === 'InvoiceRaised');

  // Verify that an InvoiceRaised event was created with the correct attributes
  expect(invoiceRaisedEvents).toHaveLength(1);
  const invoiceRaisedEvent = invoiceRaisedEvents[0];

  expect(invoiceRaisedEvent).toMatchObject({
    type: 'InvoiceRaised',
    data: {
      jobId: 'job1',
      quotationId: 'quote1',
      customerId: 'cust1',
      amount: 1000,
      currency: 'USD',
      description: 'Test Job 1'
    }
  });

  console.log('[Test] Successfully processed todo item and verified InvoiceRaised event');
});

});

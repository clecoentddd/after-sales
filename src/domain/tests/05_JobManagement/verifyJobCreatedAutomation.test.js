import { eventBus } from '../../core/eventBus';
import { initializeCreateJobEventHandler } from '../../features/05_JobManagement/0501_CreateJobAutomation/eventHandler.js';
import { jobEventStore } from '@core/eventStore';

// Array to hold events captured during the test
let capturedEvents = [];

describe('CreateJobEventHandler', () => {
  beforeEach(() => {
    // Clear captured events before each test
    capturedEvents = [];

    // Initialize the event handler
    initializeCreateJobEventHandler();

    // Subscribe to all events to capture them
    eventBus.subscribe('*', (eventType, event) => {
      capturedEvents.push({ eventType, event });
    });
  });

  it('should create a job when a QuotationHasBeenApproved event is received', async () => {
    // Define the quotation approved event
    const quotationApprovedEvent = {
      type: 'QuotationHasBeenApproved',
      quotationId: 'quotation-123',
      data: {
        requestId: 'request-123',
        changeRequestId: 'change-request-123',
        quotationDetails: {
          title: 'REQ1',
          estimatedAmount: '5000.00',
          currency: 'CHF',
          operations: [{ operation: 'op1' }, { operation: 'op2' }],
        },
      },
    };

    // Publish the event
    eventBus.publish(quotationApprovedEvent);

    // Wait for a short period to allow event processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if a JobCreated event was captured
    const jobCreatedEvents = jobEventStore.getEvents().filter(e => e.type === 'JobCreated');

    // Use Jest's expect syntax to assert that exactly one JobCreated event was published
    expect(jobCreatedEvents).toHaveLength(1);
    console.log ("Job created event is", jobCreatedEvents[0]);

    // Assert that the JobCreated event was published with the correct details
    const jobCreatedEvent = jobCreatedEvents[0];

    expect(jobCreatedEvent.data.requestId).toBe(quotationApprovedEvent.data.requestId);
    expect(jobCreatedEvent.data.changeRequestId).toBe(quotationApprovedEvent.data.changeRequestId);
    expect(jobCreatedEvent.data.jobDetails.description).toEqual(quotationApprovedEvent.data.quotationDetails.operations);
    expect(jobCreatedEvent.data.status).toBe('Pending');
  });
});

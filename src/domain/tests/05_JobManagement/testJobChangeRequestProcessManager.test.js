// src/domain/tests/05_JobManagement/testJobChangeRequestProcessManager.test.js
import { eventBus } from '@core/eventBus';
import { initializeCreatedJobChangeRequestProcessManager } from '../../features/05_JobManagement/92_JobChangeRequestManager/initializeCreatedJobChangeRequestProcessManager';
import { jobEventStore } from '@core/eventStore';

describe('JobChangeRequestProcessManager', () => {
  let capturedJobOnHoldEvents = [];
  let capturedChangeRequestEvents = [];

  beforeEach(() => {
    // Clear captured events before each test
    capturedJobOnHoldEvents = [];
    capturedChangeRequestEvents = [];

    // Clear the event store before each test
    if (jobEventStore.clear) {
      jobEventStore.clear();
    }

    // Subscribe to specific event types
    eventBus.subscribe('JobOnHold', (event) => {
      capturedJobOnHoldEvents.push(event);
      console.log(`[TEST] Captured JobOnHold for ${event.aggregateId}`);
    });

    eventBus.subscribe('ChangeRequestJobAssigned', (event) => {
      capturedChangeRequestEvents.push(event);
      console.log(`[TEST] Captured ChangeRequestJobAssigned for ${event.aggregateId}`);
    });
  });

  it('should create and publish JobOnHold events for jobs with only ChangeRequestJobAssigned', async () => {
    console.log("=== Starting test ===");

    // Add test events to the store
    const testEvents = [
      // Pair 1: Already processed (should be skipped)
      {
        type: 'ChangeRequestJobAssigned',
        aggregateId: 'job1',
        data: { changeRequestId: 'changeRequest1', requestId: 'request1' },
        timestamp: new Date().toISOString()
      },
      {
        type: 'JobOnHold',
        aggregateId: 'job1',
        changeRequestId: 'changeRequest1',
        requestId: 'request1',
        data: { putOnHoldBy: 'system', reason: 'Change request assigned' },
        metadata: { timestamp: new Date().toISOString() }
      },
      // Pair 2: Needs processing
      {
        type: 'ChangeRequestJobAssigned',
        aggregateId: 'job2',
        data: { changeRequestId: 'changeRequest2', requestId: 'request2' },
        timestamp: new Date().toISOString()
      },
      {
        type: 'JobCreated',
        aggregateId: 'job2',
        data: { status: 'ToBeProcessed' },
        timestamp: new Date().toISOString()
      }
    ];

    // Add test events to the store
    testEvents.forEach(event => {
      jobEventStore.append(event);
      console.log(`Added test event: ${event.type} for ${event.aggregateId}`);
    });

    // Initialize the process manager
    initializeCreatedJobChangeRequestProcessManager();

    // Publish test event
    console.log("\nPublishing ChangeRequestJobAssigned event for job2");
    eventBus.publish({
      type: 'ChangeRequestJobAssigned',
      aggregateId: 'job2',
      data: { changeRequestId: 'changeRequest2', requestId: 'request2' },
      timestamp: new Date().toISOString()
    });

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check results for job2
    const job2JobOnHoldEvents = capturedJobOnHoldEvents.filter(e => e.aggregateId === 'job2');
    console.log(`\nFound ${job2JobOnHoldEvents.length} JobOnHold events for job2 in captured events`);

    // Check the event store directly
    const storeEvents = jobEventStore.getEvents();
    const storeJobOnHoldEvents = storeEvents.filter(e =>
      e.type === 'JobOnHold' && e.aggregateId === 'job2'
    );
    console.log(`Found ${storeJobOnHoldEvents.length} JobOnHold events for job2 in event store`);

    // Verify the results
    expect(job2JobOnHoldEvents.length).toBe(1);
    expect(job2JobOnHoldEvents[0].aggregateId).toBe('job2');
    expect(job2JobOnHoldEvents[0].changeRequestId).toBe('changeRequest2');
    expect(job2JobOnHoldEvents[0].type).toBe('JobOnHold');

    // Verify job1 was not processed (no new JobOnHold event for it)
    const job1JobOnHoldEvents = capturedJobOnHoldEvents.filter(e => e.aggregateId === 'job1');
    expect(job1JobOnHoldEvents.length).toBe(0);

    // Verify we received the ChangeRequestJobAssigned event for job2
    const job2ChangeRequestEvents = capturedChangeRequestEvents.filter(e => e.aggregateId === 'job2');
    expect(job2ChangeRequestEvents.length).toBe(1);
  });
});

// src/domain/tests/05_JobManagement/testJobChangeRequestProcessManager.test.js
import { eventBus } from '@core/eventBus';
import { initializeCreatedJobChangeRequestProcessManager } from '../../features/05_JobManagement/92_JobChangeRequestManager/initializeCreatedJobChangeRequestProcessManager';
import { jobEventStore } from '@core/eventStore';

describe('JobChangeRequestProcessManager', () => {
  let capturedJobOnHoldEvents = [];
  let capturedChangeRequestEvents = [];

  beforeEach(() => {
    capturedJobOnHoldEvents = [];
    capturedChangeRequestEvents = [];

    if (jobEventStore.clear) {
      jobEventStore.clear();
    }

    eventBus.subscribe('JobOnHold', (event) => {
      capturedJobOnHoldEvents.push(event);
    });

    eventBus.subscribe('ChangeRequestJobAssigned', (event) => {
      capturedChangeRequestEvents.push(event);
    });
  });

  it('should create and publish JobOnHold events for all assignments without existing JobOnHold', async () => {
    // Add test events to the store
    const testEvents = [
      // Already processed (job1)
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
      // Needs processing (job2)
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
      },
      // Needs processing (job3)
      {
        type: 'ChangeRequestJobAssigned',
        aggregateId: 'job3',
        data: { changeRequestId: 'changeRequest3', requestId: 'request3' },
        timestamp: new Date().toISOString()
      },
      {
        type: 'JobCreated',
        aggregateId: 'job3',
        data: { status: 'ToBeProcessed' },
        timestamp: new Date().toISOString()
      }
    ];

    testEvents.forEach(event => jobEventStore.append(event));

    initializeCreatedJobChangeRequestProcessManager();

    // Trigger processing by publishing any assignment (job2 here)
    eventBus.publish({
      type: 'ChangeRequestJobAssigned',
      aggregateId: 'job2',
      data: { changeRequestId: 'changeRequest2', requestId: 'request2' },
      timestamp: new Date().toISOString()
    });

    await new Promise(resolve => setTimeout(resolve, 100)); // wait for async processing

    // Verify JobOnHold events were created for job2 and job3
    const job2Hold = capturedJobOnHoldEvents.find(e => e.aggregateId === 'job2');
    const job3Hold = capturedJobOnHoldEvents.find(e => e.aggregateId === 'job3');
    const job1Hold = capturedJobOnHoldEvents.find(e => e.aggregateId === 'job1');

    expect(job2Hold).toBeDefined();
    expect(job2Hold.changeRequestId).toBe('changeRequest2');

    expect(job3Hold).toBeDefined();
    expect(job3Hold.changeRequestId).toBe('changeRequest3');

    // job1 already has JobOnHold, should not be processed again
    expect(job1Hold).toBeUndefined();

    // Optional: verify event store also has the JobOnHold events
    const storeJobOnHoldEvents = jobEventStore.getEvents().filter(e => e.type === 'JobOnHold');
    expect(storeJobOnHoldEvents.map(e => e.aggregateId)).toEqual(expect.arrayContaining(['job2','job3']));
  });
});

import { requestEventStore } from '@core/eventStore';
import { jobEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';
import { initializeJobChangeRequestProjector } from '../JobChangeRequestProjector';
import { initializeProcessManager } from '../../0561_AssignCRtoJob/ProcessManager';
import { RequestRaisedEvent } from '@events/requestRaisedEvent';
import { JobCreatedEvent } from '@events/jobCreatedEvent';
import {  JobStartedEvent } from '@events/jobStartedEvent';
import { ChangeRequestRaisedEvent } from '@events/changeRequestRaisedEvent';
import { jobChangeRequestProjection } from '../JobChangeRequestProjection';

describe('ProcessManager rejects change request if job started', () => {
  beforeEach(() => {
    // Reset stores and projections
    requestEventStore.clear();
    jobEventStore.clear();
    jobChangeRequestProjection.clear();

    // Initialize projector and process manager
    initializeJobChangeRequestProjector();
    initializeProcessManager();
  });

  test('rejects ChangeRequestRaised if job already started', async () => {
    // Step 1: Request raised
    const req1 = RequestRaisedEvent({
      requestId: 'req1',
      changeRequestId: 'cr0',
      versionId: 'v1',
      customerId: 'cust1',
      requestDetails: 'Initial request',
      status: 'open',
    });
    requestEventStore.append(req1);

    // Step 2: Job created
    const job1 = JobCreatedEvent('job1', 'req1', 'cr0', 'quo1', { title: 'Job 1' });
    jobEventStore.append(job1);

    // Step 3: Job started
    const jobStarted = JobStartedEvent('job1', 'req1', 'cr0', 'teamA', 'user1');
    jobEventStore.append(jobStarted);

    // Step 4: Initialize the projection manually for the first row
    jobChangeRequestProjection.insert({
      requestId: 'req1',
      changeRequestId: 'cr0',
      jobId: 'job1',
      todo: 'Done'
    });

    // Step 5: New change request raised
    const cr1 = ChangeRequestRaisedEvent('req1', 'cr1', 'user2', 'Update details', 'v2');
    eventBus.publish(cr1);

    // Step 6: Verify that the new change request row is rejected (todo = true)
    const rows = jobChangeRequestProjection.getAll();
    const newRow = rows.find(r => r.requestId === 'req1' && r.changeRequestId === 'cr1');

    expect(newRow).toBeDefined();
    expect(newRow.todo).toBe('Failed'); // rejected because job already started

    // Optional: verify that original row is unchanged
    const originalRow = rows.find(r => r.requestId === 'req1' && r.changeRequestId === 'cr0');
    expect(originalRow.todo).toBe('Done');
  });
});

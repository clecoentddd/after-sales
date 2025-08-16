// tests/completedJobChangeRequestProcessManager.test.js
import { eventBus } from '../../core/eventBus';
import { jobEventStore } from '../../core/eventStore';
import { JobAggregate } from '../../entities/Job/aggregate';

import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { JobStartedEvent } from '../../events/jobStartedEvent';
import { JobCompletedEvent } from '../../events/jobCompletedEvent';
import { ChangeRequestJobAssignedEvent } from '../../events/changeRequestJobAssignedEvent';
import { JobCompletedChangeRequestRejectedEvent } from '../../events/jobCompletedChangeRequestRejectedEvent';

import { initializeCompletedJobChangeRequestProcessManager } from '../../features/05_JobManagement/0555_CompletedJobChangeRequestProcessManager/initializeCompletedJobRequestProcessManager';


describe('CompletedJobChangeRequestProcessManager', () => {
  beforeEach(() => {
    jobEventStore.events = []; // reset in-memory store
  });

  it('should reject a change request when the job is already completed', () => {
    const jobId = 'job-777';
    const requestId = 'req-42';
    const changeRequestId = 'cr-99';

    // --- Step 1: Seed job history with Completed status ---
    const history = [
      JobCreatedEvent(jobId, requestId, null, 'quote-1', { title: 'Completed Job' }, 'Pending'),
      JobStartedEvent(jobId, requestId, null, 'Team X', 'user-1'),
      JobCompletedEvent(jobId, requestId, null, 'user-2', { notes: 'done' }),
    ];
    history.forEach(ev => jobEventStore.append(ev));

    // --- Step 2: Initialize process manager ---
    initializeCompletedJobChangeRequestProcessManager();

    // --- Step 3: Subscribe to listen for rejection event ---
    let publishedEvent;
    eventBus.subscribe('JobChangeRequestRejected', (event) => {
      publishedEvent = event;
    });

    // --- Step 4: Publish ChangeRequestJobAssigned ---
    const assigned = ChangeRequestJobAssignedEvent(jobId, requestId, changeRequestId, { assignedBy: 'system' });
    eventBus.publish(assigned);

    // --- Step 5: Verify rejection was published ---
    expect(publishedEvent).toEqual(
      expect.objectContaining({
        type: 'JobChangeRequestRejected',
        aggregateId: jobId,
        aggregateType: 'Job',
        requestId,
        changeRequestId,
        data: { 
            reason: 'Cannot apply a change request to a job that is already complete',
            rejectedBy: 'Automated Response from System',
            CRstatus: 'Rejected',
        },
      })
    );

    // --- Step 6: Verify CRstatus still null in aggregate ---
    const aggregate = new JobAggregate();
    aggregate.replay(jobEventStore.getEventsByAggregateId(jobId));
    expect(aggregate.CRstatus).toBeNull();
  });
});

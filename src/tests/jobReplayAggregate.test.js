// jobAggregateReplay.test.js
import { jobEventStore } from '@core/eventStore';
import { JobAggregate, reconstructJobState } from '@entities/Job/aggregate';
import { v4 as uuidv4 } from 'uuid';

describe('Job aggregate replay', () => {
  beforeEach(() => {
    jobEventStore.clear();
  });

  it('should produce Completed status and correct team after replaying events from commands', () => {
    const quotationId = uuidv4();
    const requestId = uuidv4();
    const changeRequestId = uuidv4();

    // ---- Step 1: Create job from quotation approval ----
    const aggregate = new JobAggregate();
    const createEvent = JobAggregate.create(
      quotationId,
      requestId,
      changeRequestId,
      { title: 'REQ2', description: 'Fix engine' }
    );
    console.log('[Test] Event from create:', createEvent);
    jobEventStore.append(createEvent);

    // ---- Step 2: Replay so we can start it ----
    aggregate.replay(jobEventStore.getEvents());
    const startEvent = aggregate.start({
      jobId: aggregate.jobId,
      requestId: aggregate.requestId,
      assignedTeam: 'Team_A',
      startedByUserId: 'user-1'
    });
    console.log('[Test] Event from start:', startEvent);
    jobEventStore.append(startEvent);

    // ---- Step 3: Replay so we can complete it ----
    aggregate.replay(jobEventStore.getEvents());
    const completeEvent = aggregate.complete({
      jobId: aggregate.jobId,
      requestId: aggregate.requestId,
      completedBy: 'user-1',
      completionDetails: { notes: 'Job done' }
    });
    console.log('[Test] Event from complete:', completeEvent);
    jobEventStore.append(completeEvent);

    // ---- Step 4: Reconstruct final state from replay ----
    const finalState = reconstructJobState(aggregate.jobId);
    console.log('[Test] Final reconstructed state:', finalState);

    expect(finalState.status).toBe('Completed');
    expect(finalState.assignedTeam).toBe('Team_A');
    expect(finalState.quotationId).toBe(quotationId);
    expect(finalState.changeRequestId).toBe(changeRequestId);
    expect(finalState.details).toEqual(expect.objectContaining({
      title: 'Repair Job for: REQ2'
    }));
  });
});

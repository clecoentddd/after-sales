import { eventBus } from '@core/eventBus';
import { initializeStartedJobChangeRequestProcessManager } from '../../features/05_JobManagement/0554_StartedJobChangeRequestManager/initializeStartedJobChangeRequestProcessManager';
import { jobEventStore } from '@core/eventStore';
import { JobAggregate } from '../../entities/Job/aggregate';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { JobStartedEvent } from '../../events/jobStartedEvent';
import { JobFlaggedForAssessmentEvent } from '../../events/jobFlaggedForAssessmentEvent';

describe('JobChangeRequestAssessmentManager & JobAggregate', () => {
  let capturedAssessmentEvents = [];

  beforeEach(() => {
    capturedAssessmentEvents = [];

    // Clear event store if available
    if (jobEventStore.clear) {
      jobEventStore.clear();
    }

    // Subscribe to capture assessment events
    eventBus.subscribe('ChangeRequestReceivedPendingAssessment', (event) => {
      capturedAssessmentEvents.push(event);
      console.log('[TEST] Captured assessment event:', JSON.stringify(event, null, 2));
    });
  });

  describe('Integration: Process Manager', () => {
    it('should create and publish assessment events for started jobs with new change requests', async () => {
      // Append initial JobCreated + JobStarted events
      const testEvents = [
        {
          type: 'JobCreated',
          aggregateId: 'job1',
          requestId: 'request1',
          changeRequestId: 'changeRequest1',
          data: { status: 'Pending' },
          timestamp: new Date().toISOString()
        },
        {
          type: 'JobStarted',
          aggregateId: 'job1',
          requestId: 'request1',
          changeRequestId: 'changeRequest1',
          data: { status: 'Started', assignedTeam: 'TeamA' },
          timestamp: new Date().toISOString()
        }
      ];

      testEvents.forEach(event => jobEventStore.append(event));
      initializeStartedJobChangeRequestProcessManager();

      // Trigger ChangeRequestJobAssigned
      const triggerEvent = {
        type: 'ChangeRequestJobAssigned',
        aggregateId: 'job1',
        data: { changeRequestId: 'changeRequest1', startedBy: 'user1' },
        timestamp: new Date().toISOString()
      };
      eventBus.publish(triggerEvent);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assertions
      expect(capturedAssessmentEvents.length).toBe(1);
      const evt = capturedAssessmentEvents[0];
      expect(evt.aggregateId).toBe('job1');
      expect(evt.changeRequestId).toBe('changeRequest1');
      expect(evt.data.CRstatus).toBe('ChangeRequestReceivedPendingAssessment');
      expect(evt.data.reason).toBe('Change request started - assessment required');

      // Check store
      const stored = jobEventStore.getEvents().filter(e =>
        e.type === 'ChangeRequestReceivedPendingAssessment' && e.aggregateId === 'job1'
      );
      expect(stored.length).toBe(1);
    });
  });

  describe('Unit: JobAggregate', () => {
    let aggregate;
    const jobId = 'job1';
    const requestId = 'request1';
    const flaggedByUserId = 'user1';

    beforeEach(() => {
      aggregate = new JobAggregate();
      aggregate.apply(JobCreatedEvent(jobId, requestId, 'cr-1', 'quotation-1', { title: 'Test Job', operations: 'Ops', currency: 'USD', estimatedAmount: 100 }));
      aggregate.apply(JobStartedEvent(jobId, requestId, 'cr-1', 'TeamA', flaggedByUserId));
    });

    test('should allow first change request flag', () => {
      const event = aggregate.flagForAssessment({
        jobId,
        flaggedByUserId,
        reason: 'First assessment',
        changeRequestId: 'cr-1'
      });
      expect(event).toBeDefined();
      expect(event.type).toBe('ChangeRequestReceivedPendingAssessment');
      aggregate.apply(event);
      expect(aggregate.CRstatus).toBe('ChangeRequestReceivedPendingAssessment');
    });

    test('should prevent second change request if first is already flagged', () => {
      // First flag
      const firstFlag = aggregate.flagForAssessment({
        jobId,
        flaggedByUserId,
        reason: 'First assessment',
        changeRequestId: 'cr-1'
      });
      aggregate.apply(firstFlag);

      // Attempt second change request
      const secondFlag = aggregate.flagForAssessment({
        jobId,
        flaggedByUserId,
        reason: 'Second assessment attempt',
        changeRequestId: 'cr-2'
      });

      expect(secondFlag).toBeNull();
      expect(aggregate.CRstatus).toBe('ChangeRequestReceivedPendingAssessment');
    });
  });
});

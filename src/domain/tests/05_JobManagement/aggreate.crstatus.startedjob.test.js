// src/domain/tests/05_JobManagement/job.aggregate.crstatus.started.test.js
import { JobAggregate } from '../../entities/Job/aggregate';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { JobStartedEvent } from '../../events/jobStartedEvent';
import { JobFlaggedForAssessmentEvent } from '../../events/jobFlaggedForAssessmentEvent';

describe('JobAggregate CRstatus for Started Jobs', () => {
  let aggregate;
  const jobId = 'job-123';
  const requestId = 'req-1';
  const changeRequestId = 'cr-1';
  const startedByUserId = 'user-1';
  const flaggedByUserId = 'user-2';

  // Test the event factory directly first
  describe('Event Factory', () => {
    test('should create proper event structure', () => {
      const event = JobFlaggedForAssessmentEvent(
        jobId,
        requestId,
        changeRequestId,
        flaggedByUserId,
        'Test reason'
      );

      console.log('\n=== EVENT FACTORY TEST ===');
      console.log('Factory output:', JSON.stringify(event, null, 2));
      console.log('Has aggregateId:', !!event.aggregateId);
      console.log('Has requestId:', !!event.requestId);
      console.log('Has changeRequestId:', !!event.changeRequestId);

      expect(event).toBeDefined();
      expect(event.aggregateId).toBe(jobId);
      expect(event.requestId).toBe(requestId);
      expect(event.changeRequestId).toBe(changeRequestId);
      expect(event.type).toBe('ChangeRequestReceivedPendingAssessment');
      expect(event.data.CRstatus).toBe('ChangeRequestReceivedPendingAssessment');
    });
  });

  describe('Job Aggregate', () => {
    beforeEach(() => {
      aggregate = new JobAggregate();
      console.log('\n=== SETUP ===');
      console.log('Creating job with:', { jobId, requestId, changeRequestId });

      // Create the job
      const jobCreated = JobCreatedEvent(
        jobId,
        requestId,
        changeRequestId,
        'quotation-1',
        { title: 'Test Job', operations: 'Test operations', currency: 'USD', estimatedAmount: 100 }
      );
      console.log('JobCreated event:', JSON.stringify(jobCreated, null, 2));
      aggregate.apply(jobCreated);

      // Start the job
      const startEvent = JobStartedEvent(
        jobId,
        requestId,
        changeRequestId,
        'TeamA',
        startedByUserId
      );
      console.log('JobStarted event:', JSON.stringify(startEvent, null, 2));
      aggregate.apply(startEvent);

      console.log('Aggregate state after setup:');
      console.log('- status:', aggregate.status);
      console.log('- CRstatus:', aggregate.CRstatus);
      console.log('- jobId:', aggregate.jobId);
      console.log('- requestId:', aggregate.requestId);
      console.log('- changeRequestId:', aggregate.changeRequestId);
    });

    test('should allow flagging for assessment when job is Started', () => {
      console.log('\n=== TEST 1: FLAGGING STARTED JOB ===');

      const command = {
        jobId,
        flaggedByUserId,
        reason: 'Change request requires assessment',
        changeRequestId
      };
      console.log('Command:', JSON.stringify(command, null, 2));

      const flagEvent = aggregate.flagForAssessment(command);
      console.log('Returned event:', JSON.stringify(flagEvent, null, 2));
      console.log('Event keys:', flagEvent ? Object.keys(flagEvent) : 'null');

      if (flagEvent) {
        console.log('Event properties:');
        console.log('- type:', flagEvent.type);
        console.log('- aggregateId:', flagEvent.aggregateId);
        console.log('- requestId:', flagEvent.requestId);
        console.log('- changeRequestId:', flagEvent.changeRequestId);
        console.log('- data.CRstatus:', flagEvent.data?.CRstatus);
      }

      expect(flagEvent).toBeDefined();
      expect(flagEvent).not.toBeNull();
      expect(flagEvent.type).toBe('ChangeRequestReceivedPendingAssessment');
      expect(flagEvent.aggregateId).toBe(jobId);
      expect(flagEvent.requestId).toBe(requestId);
      expect(flagEvent.changeRequestId).toBe(changeRequestId);
      expect(flagEvent.data.CRstatus).toBe('ChangeRequestReceivedPendingAssessment');
      expect(flagEvent.data.reason).toBe('Change request requires assessment');

      // Apply the event to update state
      aggregate.apply(flagEvent);
      console.log('Aggregate state after applying event:');
      console.log('- status:', aggregate.status);
      console.log('- CRstatus:', aggregate.CRstatus);

      expect(aggregate.CRstatus).toBe('ChangeRequestReceivedPendingAssessment');
      expect(aggregate.status).toBe('Started');
    });

    test('should prevent flagging for assessment when job is not Started', () => {
      console.log('\n=== TEST 2: FLAGGING NON-STARTED JOB ===');

      // Reset to Pending status
      aggregate = new JobAggregate();
      aggregate.apply(
        JobCreatedEvent(
          jobId,
          requestId,
          changeRequestId,
          'quotation-1',
          { title: 'Test Job', operations: 'Test operations', currency: 'USD', estimatedAmount: 100 }
        )
      );

      const flagEvent = aggregate.flagForAssessment({
        jobId,
        flaggedByUserId,
        reason: 'Should not work',
        changeRequestId
      });

      console.log('Returned event:', flagEvent);
      expect(flagEvent).toBeNull();
    });

    test('should prevent flagging for assessment when already flagged', () => {
      console.log('\n=== TEST 3: DUPLICATE FLAGGING ===');

      // First flag for assessment
      const firstFlagEvent = aggregate.flagForAssessment({
        jobId,
        flaggedByUserId,
        reason: 'First assessment',
        changeRequestId
      });
      console.log('First flag event:', JSON.stringify(firstFlagEvent, null, 2));
      aggregate.apply(firstFlagEvent);

      // Try to flag again
      const secondFlagEvent = aggregate.flagForAssessment({
        jobId,
        flaggedByUserId,
        reason: 'Second assessment',
        changeRequestId
      });
      console.log('Second flag event:', secondFlagEvent);

      expect(secondFlagEvent).toBeNull();
      expect(aggregate.CRstatus).toBe('ChangeRequestReceivedPendingAssessment');
    });

    test('should set CRstatus when applying ChangeRequestReceivedPendingAssessment event', () => {
      console.log('\n=== TEST 4: DIRECT EVENT APPLICATION ===');

      const flagEvent = JobFlaggedForAssessmentEvent(
        jobId,
        requestId,
        changeRequestId,
        flaggedByUserId,
        'Test assessment'
      );
      console.log('Direct event:', JSON.stringify(flagEvent, null, 2));

      aggregate.apply(flagEvent);
      console.log('State after direct application:');
      console.log('- status:', aggregate.status);
      console.log('- CRstatus:', aggregate.CRstatus);

      expect(aggregate.CRstatus).toBe('ChangeRequestReceivedPendingAssessment');
      expect(aggregate.status).toBe('Started');
    });

    test('should not change overall status when flagged for assessment', () => {
      console.log('\n=== TEST 5: STATUS PRESERVATION ===');

      const initialStatus = aggregate.status;
      console.log('Initial status:', initialStatus);

      const flagEvent = aggregate.flagForAssessment({
        jobId,
        flaggedByUserId,
        reason: 'Assessment needed',
        changeRequestId
      });
      console.log('Flag event:', JSON.stringify(flagEvent, null, 2));

      aggregate.apply(flagEvent);
      console.log('Status after flagging:', aggregate.status);

      expect(aggregate.status).toBe(initialStatus);
      expect(aggregate.CRstatus).toBe('ChangeRequestReceivedPendingAssessment');
    });

    test('should include all required fields in flag event', () => {
      console.log('\n=== TEST 6: EVENT STRUCTURE VERIFICATION ===');

      const flagEvent = aggregate.flagForAssessment({
        jobId,
        flaggedByUserId,
        reason: 'Detailed assessment required',
        changeRequestId
      });

      console.log('Full event:', JSON.stringify(flagEvent, null, 2));

      // Check top-level properties
      expect(flagEvent).toBeDefined();
      expect(flagEvent.type).toBe('ChangeRequestReceivedPendingAssessment');
      expect(flagEvent.aggregateId).toBe(jobId);
      expect(flagEvent.requestId).toBe(requestId);
      expect(flagEvent.changeRequestId).toBe(changeRequestId);

      // Check data properties
      expect(flagEvent.data.CRstatus).toBe('ChangeRequestReceivedPendingAssessment');
      expect(flagEvent.data.flaggedByUserId).toBe(flaggedByUserId);
      expect(flagEvent.data.reason).toBe('Detailed assessment required');

      // Check metadata
      expect(flagEvent.metadata).toHaveProperty('timestamp');

      // Verify no duplication in data
      expect(flagEvent.data).not.toHaveProperty('jobId');
      expect(flagEvent.data).not.toHaveProperty('requestId');
    });

  });


});

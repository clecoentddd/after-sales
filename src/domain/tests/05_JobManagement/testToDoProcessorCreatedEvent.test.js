// tests/05_JobManagement/changeRequestAssessment.test.js
import { jobEventStore } from '../../core/eventStore';
import { eventBus } from '../../core/eventBus';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { ChangeRequestJobAssignedEvent } from '../../events/changeRequestJobAssignedEvent';
import { initializeChangeRequestAssessmentManager } from '../../features/05_JobManagement/initializers/initializeChangeRequestAssessmentManager';
import { getToDoDB, clearToDoDB } from '../../features/05_JobManagement/0521_ToDo_ChangeRequest_To_Assess/toDoDB';
import { JobRepository } from '../../entities/Job/repository';

// Set timeout for all tests
jest.setTimeout(10000);

describe('Change Request Assessment Workflow', () => {
  let unsubscribeManager;

  // Initialize ONCE before all tests
  beforeAll(async () => {
    console.log('[TEST] Initializing system...');
    unsubscribeManager = initializeChangeRequestAssessmentManager();
  });

  // Clean up after all tests
  afterAll(() => {
    if (unsubscribeManager) {
      unsubscribeManager();
      console.log('[TEST] System cleaned up');
    }
  });

  // Clear state before each test
  beforeEach(() => {
    clearToDoDB();
    console.log('[TEST] Cleared toDoDB before test');
  });

  it('should create and process a change request todo', async () => {
    console.log('\n=== Starting change request test ===');

    // GIVEN: Setup test data
    const jobId = 'job-123';
    const requestId = 'request-456';
    const changeRequestId = 'cr-789';
    const quotationId = 'quotation-101';

    // Verify initial state
    expect(getToDoDB()).toHaveLength(0);

    // WHEN: Create job and assign change request
    console.log('[TEST] Creating job...');
    const jobCreatedEvent = JobCreatedEvent(
      jobId,
      requestId,
      changeRequestId,
      quotationId,
      { title: 'Test Job' },
      'Pending'
    );
    await jobEventStore.append(jobCreatedEvent);

    console.log('[TEST] Assigning change request...');
    const jobAssignedEvent = ChangeRequestJobAssignedEvent(
      jobId,
      requestId,
      changeRequestId
    );
    eventBus.publish(jobAssignedEvent);

    // THEN: Verify todo was created and processed
    await new Promise((resolve) => {
      const checkInterval = setInterval(async () => {  // Added async
        const toDoDB = getToDoDB();
        console.log(`[TEST] Current toDoDB state: ${JSON.stringify(toDoDB)}`);

        // Success condition: todo exists and is processed
        if (toDoDB.length === 1 && toDoDB[0].flag === 'processed') {
          clearInterval(checkInterval);
          console.log('[TEST] Todo processed successfully');

          // Final assertions
          expect(toDoDB[0].changeRequestId).toBe(changeRequestId);
          expect(toDoDB[0].jobId).toBe(jobId);
          expect(toDoDB[0].flag).toBe('processed');

          // Reconstruct job aggregate and verify CRstatus
          const jobRepository = new JobRepository();
          const jobAggregate = await jobRepository.getById(jobId);  // Added await

          // Log the complete aggregate state
          console.log('[TEST] Complete Job Aggregate State:');
          console.log('----------------------------------');
          console.log(`- ID: ${jobAggregate.jobId}`);  // Changed from aggregateId to jobId
          console.log(`- Status: ${jobAggregate.status}`);
          console.log(`- CR Status: ${jobAggregate.CRstatus}`);
          console.log(`- Request ID: ${jobAggregate.requestId}`);
          console.log(`- Change Request ID: ${jobAggregate.changeRequestId}`);
          console.log(`- Assigned Team: ${jobAggregate.assignedTeam}`);
          console.log(`- Created At: ${jobAggregate.createdAt}`);
          console.log(`- Started At: ${jobAggregate.startedAt}`);
          console.log(`- Completed At: ${jobAggregate.completedAt}`);
          console.log('----------------------------------');

          // Verify CRstatus is "OnHold"
          expect(jobAggregate.CRstatus).toBe('OnHold');  // Fixed typo from 'On1Hold' to 'OnHold'
          resolve();
        }
      }, 100);

      // Timeout after 2 seconds
      setTimeout(async () => {  // Added async
        clearInterval(checkInterval);
        console.log('[TEST] Timeout waiting for processing');

        const toDoDB = getToDoDB();
        expect(toDoDB).toHaveLength(1);
        expect(toDoDB[0]).toEqual({
          changeRequestId: changeRequestId,
          jobId: jobId,
          flag: 'processed'
        });

        // Reconstruct job aggregate and verify CRstatus
        const jobRepository = new JobRepository();
        const jobAggregate = await jobRepository.getById(jobId);  // Added await

        // Log the complete aggregate state
        console.log('[TEST] Complete Job Aggregate State:');
        console.log('----------------------------------');
        console.log(`- ID: ${jobAggregate.jobId}`);  // Changed from aggregateId to jobId
        console.log(`- Status: ${jobAggregate.status}`);
        console.log(`- CR Status: ${jobAggregate.CRstatus}`);
        console.log(`- Request ID: ${jobAggregate.requestId}`);
        console.log(`- Change Request ID: ${jobAggregate.changeRequestId}`);
        console.log(`- Assigned Team: ${jobAggregate.assignedTeam}`);
        console.log(`- Created At: ${jobAggregate.createdAt}`);
        console.log(`- Started At: ${jobAggregate.startedAt}`);
        console.log(`- Completed At: ${jobAggregate.completedAt}`);
        console.log('----------------------------------');

        // Verify CRstatus is "OnHold"
        expect(jobAggregate.CRstatus).toBe('OnHold');  // Fixed typo from 'On1Hold' to 'OnHold'
        resolve();
      }, 2000);
    });
  });
});

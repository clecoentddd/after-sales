// tests/05_JobManagement/changeRequestAssessment.test.js
import { jobEventStore } from '../../core/eventStore';
import { eventBus } from '../../core/eventBus';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { JobStartedEvent } from '../../events/jobStartedEvent';
import { JobCompletedEvent } from '../../events/jobCompletedEvent';
import { ChangeRequestJobAssignedEvent } from '../../events/changeRequestJobAssignedEvent';
import { initializeChangeRequestAssessmentManager } from '../../features/05_JobManagement/initializers/initializeChangeRequestAssessmentManager';
import { getToDoDB, clearToDoDB } from '../../features/05_JobManagement/0521_ToDo_ChangeRequest_To_Assess/toDoDB';
import { JobRepository } from '../../entities/Job/repository';

// Set timeout for all tests
jest.setTimeout(10000);

describe('Change Request Assessment Workflow', () => {
  let unsubscribeManager;

  beforeAll(() => {
    console.log('[TEST] Initializing system...');
    unsubscribeManager = initializeChangeRequestAssessmentManager();
  });

  afterAll(() => {
    if (unsubscribeManager) {
      unsubscribeManager();
      console.log('[TEST] System cleaned up');
    }
  });

  beforeEach(() => {
    clearToDoDB();
    console.log('[TEST] Cleared toDoDB before test');
  });

  it('should create and process a change request todo with rejected status', async () => {
    console.log('\n=== Starting change request test with job lifecycle ===');

    // GIVEN: Setup test data
    const jobId = 'job-123';
    const requestId = 'request-456';
    const changeRequestId = 'cr-789';
    const quotationId = 'quotation-101';
    const startedByUserId = 'user-123';
    const completedByUserId = 'user-456';

    // Verify initial state
    expect(getToDoDB()).toHaveLength(0);

    // WHEN: Create job
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

    // Start the job
    console.log('[TEST] Starting job...');
    const jobStartedEvent = JobStartedEvent(
      jobId,
      requestId,
      changeRequestId,
      'TeamA',
      startedByUserId
    );
    await jobEventStore.append(jobStartedEvent);

    // Complete the job
    console.log('[TEST] Completing job...');
    const jobCompletedEvent = JobCompletedEvent(
      jobId,
      requestId,
      changeRequestId,
      completedByUserId,
      { notes: 'Job completed successfully', partsUsed: ['part1', 'part2'] }
    );
    await jobEventStore.append(jobCompletedEvent);

    // Assign change request to job
    console.log('[TEST] Assigning change request...');
    const jobAssignedEvent = ChangeRequestJobAssignedEvent(
      jobId,
      requestId,
      changeRequestId
    );
    eventBus.publish(jobAssignedEvent);

    // THEN: Verify todo was created and processed
    await new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        const toDoDB = getToDoDB();
        console.log(`[TEST] Current toDoDB state: ${JSON.stringify(toDoDB)}`);

        // Success condition: todo exists and is processed
        if (toDoDB.length === 1 && toDoDB[0].flag === 'processed') {
          clearInterval(checkInterval);
          console.log('[TEST] Todo processed successfully');

          // Verify the todo item
          expect(toDoDB[0]).toEqual({
            changeRequestId: changeRequestId,
            jobId: jobId,
            flag: 'processed'
          });

          resolve();
        }
      }, 100);

      // Timeout after 2 seconds
      setTimeout(async () => {
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
        const jobAggregate = await jobRepository.getById(jobId);
        // Log the complete aggregate state
        console.log('[TEST] Complete Job Aggregate State:');
        console.log('----------------------------------');
        console.log(`- ID: ${jobAggregate.jobId}`);
        console.log(`- Status: ${jobAggregate.status}`);
        console.log(`- CR Status: ${jobAggregate.CRstatus}`);
        console.log(`- Request ID: ${jobAggregate.requestId}`);
        console.log(`- Change Request ID: ${jobAggregate.changeRequestId}`);
        console.log(`- Assigned Team: ${jobAggregate.assignedTeam}`);
        console.log(`- Created At: ${jobAggregate.createdAt}`);
        console.log(`- Started At: ${jobAggregate.startedAt}`);
        console.log(`- Completed At: ${jobAggregate.completedAt}`);
        console.log('----------------------------------');

        // Verify CRstatus is "rejected"
        expect(jobAggregate.CRstatus).toBe('Rejected');

        resolve();
      }, 2000);
    });
  });
});

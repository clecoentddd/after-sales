import { JobCreatedEvent} from '../../events/jobCreatedEvent';
import { JobStartedEvent } from '../../events/jobStartedEvent';
import { JobCompletedEvent } from '../../events/jobCompletedEvent';
import { jobCompletedEnrichedEvent } from '../../events/jobCompletedEnrichedEvent';
import { jobEventStore } from '../../core/eventStore';
import { JobAggregate } from '../../entities/Job/aggregate';

// Mock data for the job
const mockJobDetails = {
  title: 'Repair Job for: REQ1',
  description: [{ operation: 'op1' }, { operation: 'op2' }],
  priority: 'Normal',
  assignedTeam: 'Unassigned',
  currency: 'CHF',
  amount: '5000.00'
};

const jobId = 'job123';
const requestId = 'request123';
const changeRequestId = 'changeRequest123';
const quotationId = 'quotation123';
const userId = 'user123';


 it('should simulate job lifecycle and verify final state', () => {
    testJobLifecycle(); // ✅ appelé ici
  });
  
// Test function to simulate job lifecycle
const testJobLifecycle = () => {
  // Step 1: Create a job
  const jobCreatedEvent = JobCreatedEvent(jobId, requestId, changeRequestId, quotationId, mockJobDetails);
  jobEventStore.append(jobCreatedEvent);

  // Step 2: Replay events to get the current state of the aggregate
  const events = jobEventStore.getEvents().filter(e => e.aggregateId === jobId);
  const aggregate = new JobAggregate();
  aggregate.replay(events);

  // Step 3: Start the job
  const jobStartedEvent = JobStartedEvent(jobId, 'Team A', userId);
  jobEventStore.append(jobStartedEvent);

  // Step 4: Complete the job
  const completionDetails = { notes: 'Job completed successfully' };
  const jobCompletedEvent = JobCompletedEvent(jobId, userId, completionDetails);
  jobEventStore.append(jobCompletedEvent);

  // Step 5: Replay all events to get the final state of the aggregate
  const allEvents = jobEventStore.getEvents().filter(e => e.aggregateId === jobId);
  const finalAggregate = new JobAggregate();
  allEvents.forEach(event => finalAggregate.replay([event]));

  // Step 6: Create and check the enriched event
  const enrichedEvent = jobCompletedEnrichedEvent(finalAggregate);

  // Logs for verification
  console.log('Final Aggregate State:', finalAggregate);
  console.log('Enriched Job Completed Event:', enrichedEvent);

  // Assertions
  if (finalAggregate.status !== 'Completed') {
    throw new Error('Job status is not "Completed"');
  }

  if (enrichedEvent.type !== 'JobHasBeenCompleted') {
    throw new Error('Enriched event type is not "JobHasBeenCompleted"');
  }

  console.log('Test completed successfully');
};

// Run the test
testJobLifecycle();

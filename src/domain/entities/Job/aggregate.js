import { v4 as uuidv4 } from 'uuid';
import { JobCreatedEvent } from '@events/jobCreatedEvent';
import { JobStartedEvent } from '@events/jobStartedEvent';
import { JobCompletedEvent } from '@events/jobCompletedEvent';
import { JobOnHoldEvent } from '@events/jobOnHoldEvent';
import { JobFlaggedForAssessmentEvent } from '@events/jobFlaggedForAssessmentEvent';

export class JobAggregate {
  constructor() {
    this.jobId = null;
    this.requestId = null;
    this.changeRequestId = null;
    this.quotationId = null;
    this.jobDetails = null;
    this.status = 'NotCreated';
    this.assignedTeam = null;
    this.startedByUserId = null;
    this.startedAt = null; // Removed trailing comma
    this.onHoldReason = null;
    this.completedByUserId = null;
    this.completionDetails = {};
    this.completedAt = null;
  }

  /**
   * Rebuild aggregate from a list of events (chronological order recommended).
   */
  replay(events) {
    if (!Array.isArray(events)) return;

    for (const ev of events) {
      console.log(`[JobAggregate] Processing event: ${ev.type}`, ev.data || {});
      this.apply(ev);
      console.log(`[JobAggregate] Status after event: ${this.status}`);
    }
  }

  /**
   * Apply a single event to mutate internal state.
   */
  apply(ev) {
    const data = ev.data || {};

    switch (ev.type) {
      case 'JobCreated':
        this.jobId = ev.aggregateId; // Changed from `event.aggregateId` to `ev.aggregateId`
        this.requestId = ev.requestId;
        this.changeRequestId = ev.changeRequestId;
        this.quotationId = data.quotationId;
        this.jobDetails = data.jobDetails;
        this.status = data.status || 'Pending';
        break;
      case 'JobStarted':
        this.status = data.status || 'Started';
        this.assignedTeam = data.assignedTeam;
        this.startedByUserId = data.startedByUserId;
        this.startedAt = data.startedAt;
        break;
      case 'JobCompleted':
        this.status = 'Completed';
        this.completedByUserId = data.completedByUserId;
        this.completionDetails = data.completionDetails;
        this.completedAt = data.completedAt;
        break;
      case 'JobOnHold':
        this.status = 'OnHold';
        this.onHoldReason = data.reason || data.onHoldReason || this.onHoldReason;
        break;
      case 'ChangeRequestReceivedPendingAssessment':
        this.status = 'ChangeRequestReceivedPendingAssessment';
        break;
      default:
        // Ignore unknown events
        break;
    }
  }

  /**
   * Create a JobCreated event from an approved quotation.
   */
  // In JobAggregate class
static create(command) {
  const jobId = uuidv4();
  const jobDetails = {
    title: `Repair Job for: ${command.quotationDetails.title}`,
    description: command.quotationDetails.operations,
    priority: 'Normal',
    assignedTeam: 'Unassigned',
    currency: command.quotationDetails.currency,
    amount: command.quotationDetails.estimatedAmount,
  };

  return JobCreatedEvent(
    jobId,
    command.requestId,
    command.changeRequestId,
    command.quotationId,
    jobDetails,
    'Pending'
  );
}


start(command) {
  // Check if the job is in the correct state to be started
  if (this.status !== 'Pending') {
    throw new Error(
      `Cannot start job ${command.jobId}. ` +
      `Current status: ${this.status}. ` +
      `Expected: 'Pending'`
    );
  }

  // Check if required fields are present (defensive programming)
  if (!this.requestId || !this.changeRequestId) {
    throw new Error(
      `Job ${command.jobId} is missing required fields (requestId or changeRequestId).`
    );
  }

  // Create and return the JobStartedEvent
  return JobStartedEvent(
    command.jobId,
    this.requestId,
    this.changeRequestId,
    command.assignedTeam,
    command.startedByUserId
  );
}

  complete(command) {
    if (this.status === 'Completed') return null;
    if (this.status !== 'Started') {
      throw new Error(`Cannot complete job ${command.jobId}. Current status: ${this.status}. Expected: 'Started'`);
    }
    return JobCompletedEvent(
      command.jobId,
      this.requestId,
      this.changeRequestId,
      command.completedBy,
      command.completionDetails
    );
  }

  putOnHold(command) {
    if (this.status === 'Completed' || this.status === 'OnHold') return null;
    return JobOnHoldEvent(
      command.jobId,
      this.requestId,
      command.changeRequestId,
      command.heldByUserId,
      command.reason
    );
  }

  flagForAssessment(command) {
    if (this.status !== 'Started') return null;
    return JobFlaggedForAssessmentEvent(
      command.jobId,
      this.requestId,
      command.changeRequestId,
      command.flaggedByUserId,
      command.reason
    );
  }
}

import { v4 as uuidv4 } from 'uuid';
import { JobCreatedEvent } from '@events/jobCreatedEvent';
import { JobStartedEvent } from '@events/jobStartedEvent';
import { JobCompletedEvent } from '@events/jobCompletedEvent';
import { JobOnHoldEvent } from '@events/jobOnHoldEvent';
import { JobFlaggedForAssessmentEvent } from '@events/jobFlaggedForAssessmentEvent';
import {JobCompletedChangeRequestRejectedEvent} from '@events/jobCompletedChangeRequestRejectedEvent';


// Map status to event factory functions
const statusToEventMap = {
  Pending: (job, command) =>
    JobOnHoldEvent(
      job.jobId,
      job.requestId,
      command.changeRequestId,
      command.heldByUserId,
      command.reason || 'Change request assessment pending'
    ),
  Started: (job, command) =>
    JobFlaggedForAssessmentEvent(
      job.jobId,
      job.requestId,
      command.changeRequestId,
      command.flaggedByUserId,
      command.reason || 'Change request flagged for assessment'
    ),
  Completed: (job, command) =>
    JobCompletedChangeRequestRejectedEvent(
      job.jobId,
      job.requestId,
      command.changeRequestId,
      'Change request rejected: Job already completed',
      'Automated Response from System'
    ),
};

export class JobAggregate {
constructor() {
  this.jobId = null;
  this.requestId = null;
  this.changeRequestId = null;
  this.quotationId = null;
  this.jobDetails = null;
  this.status = 'NotCreated';
  this.CRstatus = null;  // Add this line
  this.assignedTeam = null;
  this.startedByUserId = null;
  this.startedAt = null;
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
// In your JobAggregate class
// In your JobAggregate class
apply(ev) {
  const data = ev.data || {};
  switch (ev.type) {
    case 'JobCreated':
      this.jobId = ev.aggregateId;
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
      this.onHoldReason = data.reason || this.onHoldReason;
      if (data.CRstatus) {
        this.CRstatus = data.CRstatus;
      }
      break;

    case 'ChangeRequestReceivedPendingAssessment':
      this.CRstatus = data.CRstatus;
      this.onHoldReason = data.reason || this.onHoldReason;
      this.changeRequestId = data.changeRequestId;
      break;

    case 'JobFlaggedForAssessment':
      this.CRstatus = 'ChangeRequestReceivedPendingAssessment';
      this.onHoldReason = data.reason || this.onHoldReason;
      this.changeRequestId = data.changeRequestId;
      break;

    case 'JobChangeRequestRejected':  // Fixed event type name
      this.CRstatus = data.CRstatus;  // This will be 'Rejected' from your event
      this.onHoldReason = data.reason || this.onHoldReason;
      this.changeRequestId = data.changeRequestId;
      break;

    default:
      console.warn(`[JobAggregate] Unknown event type: ${ev.type}`);
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
    title: `Job for: ${command.quotationDetails.title}`,
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
  // Check if the job is on hold due to a change request
  if (this.CRstatus === 'OnHold') {
    throw new Error(
      `Cannot start job ${command.jobId}. ` +
      `Job is on hold (CRstatus: ${this.CRstatus})`
    );
  }

  // Check if the job is in the correct overall state to be started
  if (this.status !== 'Pending') {
    throw new Error(
      `Cannot start job ${command.jobId}. ` +
      `Current status: ${this.status}. ` +
      `Expected: 'Pending'`
    );
  }

  // Check if required fields are present
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
  if (this.status !== 'Pending') return null;
  return JobOnHoldEvent(
    command.jobId,
    this.requestId,
    command.changeRequestId,
    command.heldByUserId,
    command.reason
  );
}

 // In your JobAggregate class
flagForAssessment(command) {
  if (this.status !== 'Started') return null;

  // Check if already flagged for this change request
  if (this.CRstatus === 'ChangeRequestReceivedPendingAssessment') {
    return null;
  }

  // Use the event factory to create the event
  return JobFlaggedForAssessmentEvent(
    command.jobId,
    this.requestId,
    command.changeRequestId,
    command.flaggedByUserId,
    command.reason
  );
}

  rejectChangeRequest({ requestId, changeRequestId, reason, rejectedBy }) {
    if (!this.completedAt) {
      console.warn(`[JobAggregate] Job ${this.jobId} is not completed. Cannot reject change request ${changeRequestId}.`);
      return null;
    }

    // Return the properly formatted event
    return JobCompletedChangeRequestRejectedEvent(
      this.jobId,
      requestId,
      changeRequestId,
      "Cannot apply a change request to a job that is already complete",
      "Automated Response from System"
    );
  }

    /**
   * Assess a change request based on the current job status.
   */
  AssessChangeRequest(command) {
    const eventFactory = statusToEventMap[this.status];
    if (!eventFactory) {
      throw new Error(`Cannot assess change request for job in status: ${this.status}`);
    }
    return eventFactory(this, command);
  }
}

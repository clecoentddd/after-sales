import { v4 as uuidv4 } from 'uuid';
import { jobEventStore } from '../../core/eventStore';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { JobStartedEvent } from '../../events/jobStartedEvent';
import { JobCompletedEvent } from '../../events/jobCompletedEvent';
import { JobOnHoldEvent } from '../../events/jobOnHoldEvent';
import { JobFlaggedForAssessmentEvent } from '../../events/jobFlaggedForAssessmentEvent';

/**
 * JobAggregate - in-memory aggregate for commands & event creation
 */
export class JobAggregate {
  constructor() {
    this.jobId = null;
    this.quotationId = null;
    this.changeRequestId = null;
    this.requestId = null;
    this.customerId = null;
    this.jobDetails = null;
    this.status = 'NotCreated';
    this.assignedTeam = null;
    this.onHoldReason = null;
    this.completedAt = null;
    this.completedByUserId = null;
    // any other fields you want to track
  }

  /**
   * Rebuild aggregate from a list of events (chronological order recommended).
   * This will mutate the aggregate instance.
   * @param {Array} events
   */
  replay(events) {
  if (!Array.isArray(events)) return;

  for (const ev of events) {
    const data = ev.data || {};
    console.log(`[JobAggregate] Processing event: ${ev.type}`, data);

    switch (ev.type) {
      case 'JobCreated': {
        this.jobId = ev.aggregateId || this.jobId;
        this.requestId = data.requestId || data.reqId || this.requestId;
        this.quotationId = data.quotationId || data.quoteId || data.quotation || this.quotationId || null;
        this.changeRequestId = data.changeRequestId || data.changeRequest || null;
        this.customerId = data.customerId || null;
        this.jobDetails = data.jobDetails || data.details || this.jobDetails || {};
        if (!this.jobDetails.assignedTeam && data.assignedTeam) {
          this.jobDetails.assignedTeam = data.assignedTeam;
        }
        this.assignedTeam = this.jobDetails.assignedTeam || this.assignedTeam || null;
        this.status = data.status || this.status || 'Pending';
        break;
      }
      case 'JobStarted': {
        console.log(`[JobAggregate] Handling JobStarted event for jobId: ${ev.aggregateId}`);
        this.status = data.status || 'Started';
        const team = data.assignedTeam || data.team || (data.jobDetails && data.jobDetails.assignedTeam) || this.assignedTeam;
        if (team) {
          this.assignedTeam = team;
          if (!this.jobDetails) this.jobDetails = {};
          this.jobDetails.assignedTeam = team;
        }
        break;
      }
      case 'JobCompleted': {
        this.status = 'Completed';
        if (data.completedAt) this.completedAt = data.completedAt;
        if (data.completedByUserId) this.completedByUserId = data.completedByUserId;
        break;
      }
      case 'JobOnHold': {
        this.status = 'OnHold';
        this.onHoldReason = data.reason || data.onHoldReason || this.onHoldReason;
        break;
      }
      case 'ChangeRequestReceivedPendingAssessment': {
        this.status = 'ChangeRequestReceivedPendingAssessment';
        break;
      }
      default:
        // ignore other events
    }

    console.log(`[JobAggregate] Replaying status aggregate: ${this.status}`); // Log after each event is processed
  }
}


  /**
   * Create a JobCreated event from an approved quotation.
   * Returns the event object (does not append it to the store).
   */
  static createFromQuotationApproval(quotationId, requestId, changeRequestId, quotationDetails) {
    console.log(`[JobAggregate] Creating job from approved quotation: ${quotationId}`);
    const jobId = uuidv4();
    const jobDetails = {
      title: `Repair Job for: ${quotationDetails.title}`,
      description: `Initiated from approved quotation for request: ${quotationDetails.description || 'No description'}`,
      priority: 'Normal',
      assignedTeam: 'Unassigned'
    };
    return JobCreatedEvent(jobId, quotationId, requestId, changeRequestId, jobDetails, 'Pending', changeRequestId);
  }

  start(command) {
    if (this.status === 'Started') {
      console.warn(`[JobAggregate] Job ${command.jobId} is already started.`);
      return null;
    }
    if (this.status === 'Completed') {
      throw new Error(`Cannot start job ${command.jobId} because it is already completed.`);
    }
    return JobStartedEvent(command.jobId, command.requestId, command.assignedTeam, command.startedByUserId);
  }

  complete(command) {
    console.log(`[JobAggregate] Complete called for jobId: ${command}`);
    if (this.status === 'Completed') {
      console.warn(`[JobAggregate] Job ${command.jobId} is already completed.`);
      return null;
    }
    if (this.status !== 'Started') {
      throw new Error(`Cannot complete job ${command.jobId}. Current status: ${this.status}. Expected: 'Started'`);
    }
    return JobCompletedEvent(command.jobId, command.requestId, command.changeRequestId, command.completedBy, command.completionDetails);
  }

  putOnHold(command) {
    if (this.status === 'Completed' || this.status === 'OnHold') {
      console.warn(`[JobAggregate] Cannot put job ${command.jobId} on hold. Current status: ${this.status}`);
      return null;
    }
    return JobOnHoldEvent(
      command.jobId,
      this.requestId,
      command.changeRequestId,
      command.heldByUserId,
      command.reason
    );
  }

  flagForAssessment(command) {
    if (this.status !== 'Started') {
      console.warn(`[JobAggregate] Cannot flag job ${command.jobId} for assessment. Status is ${this.status}`);
      return null;
    }
    return JobFlaggedForAssessmentEvent(
      command.jobId,
      this.requestId,
      command.changeRequestId,
      command.flaggedByUserId,
      command.reason
    );
  }
}

/**
 * Reconstruct (replay) final job state for a given jobId using events in jobEventStore.
 * Returns a plain object containing the fields your tests expect.
 */
export const reconstructJobState = (jobId) => {
  // Get events (sorted)
  const allEvents = (jobEventStore.getEvents() || []).slice().sort((a, b) =>
    new Date(a.metadata?.timestamp || a.timestamp || 0).getTime() - new Date(b.metadata?.timestamp || b.timestamp || 0).getTime()
  );

  // Filter for the given jobId (tolerate events that put id in different places)
  const jobEvents = allEvents.filter(ev => {
    const d = ev.data || {};
    return d.jobId === jobId || ev.aggregateId === jobId || (d.job && d.job.jobId === jobId);
  });

  // Use JobAggregate to replay events and reconstruct the state
  const jobAggregate = new JobAggregate();
  jobAggregate.replay(jobEvents);

  // Return the reconstructed state as a plain object
  return {
    jobId: jobAggregate.jobId,
    requestId: jobAggregate.requestId,
    status: jobAggregate.status,
    assignedTeam: jobAggregate.assignedTeam,
    quotationId: jobAggregate.quotationId,
    changeRequestId: jobAggregate.changeRequestId,
    jobDetails: jobAggregate.jobDetails,
    onHoldReason: jobAggregate.onHoldReason,
    completedAt: jobAggregate.completedAt,
    completedByUserId: jobAggregate.completedByUserId
  };
};

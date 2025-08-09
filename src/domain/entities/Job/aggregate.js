// src/domain/entities/Job/aggregate.js
import { v4 as uuidv4 } from 'uuid';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { JobStartedEvent } from '../../events/jobStartedEvent';
import { JobCompletedEvent } from '../../events/jobCompletedEvent';
import { JobOnHoldEvent } from '../../events/jobOnHoldEvent';
import { JobFlaggedForAssessmentEvent } from '../../events/jobFlaggedForAssessmentEvent';
import { jobEventStore } from '../../core/eventStore';

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

      switch (ev.type) {
        case 'JobCreated': {
          // tolerate different shapes
          this.jobId = data.jobId || this.jobId;
          this.requestId = data.requestId || data.reqId || this.requestId;
          // prefer explicit quotationId, but allow older shapes
          this.quotationId = data.quotationId || data.quoteId || data.quotation || this.quotationId || null;
          this.changeRequestId = data.changeRequestId || data.changeRequest || null;
          this.customerId = data.customerId || null;
          // jobDetails should be an object; fall back to combining fields if needed
          this.jobDetails = data.jobDetails || data.details || this.jobDetails || {};
          // normalise assignedTeam into jobDetails and top-level
          if (!this.jobDetails.assignedTeam && data.assignedTeam) {
            this.jobDetails.assignedTeam = data.assignedTeam;
          }
          this.assignedTeam = this.jobDetails.assignedTeam || this.assignedTeam || null;
          this.status = data.status || this.status || 'Pending';
          break;
        }

        case 'JobStarted': {
          // update status and assigned team (ensure we sync into jobDetails)
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
          // optionally store completed metadata if present
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

    // NOTE: JobCreatedEvent factory in your repo may expect a particular parameter order.
    // We assume JobCreatedEvent accepts an object or positional args producing event.data with:
    // { jobId, quotationId, requestId, changeRequestId, jobDetails, status }
    // If your JobCreatedEvent signature is different, adapt the call accordingly.
    return JobCreatedEvent(jobId, quotationId, requestId, changeRequestId, jobDetails, 'Pending', changeRequestId);
    // If your JobCreatedEvent does not support changeRequestId param, you'll need to update the factory.
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
    if (this.status === 'Completed') {
      console.warn(`[JobAggregate] Job ${command.jobId} is already completed.`);
      return null;
    }
    if (this.status !== 'Started') {
      throw new Error(`Cannot complete job ${command.jobId}. Current status: ${this.status}. Expected: 'Started'`);
    }
    return JobCompletedEvent(command.jobId, command.requestId, command.completedBy, command.completionDetails);
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
 * JobStateReconstructor - small helper used by reconstructJobState()
 * It's deliberately simple and focused on returning plain JS state used in tests.
 */
class JobStateReconstructor {
  constructor() {
    this.jobId = null;
    this.requestId = null;
    this.status = null;
    this.assignedTeam = null;
    this.quotationId = null;
    this.changeRequestId = null;
    this.jobDetails = null;
    this.onHoldReason = null;
    this.completedAt = null;
    this.completedByUserId = null;
  }

  replay(events) {
    for (const ev of events) {
      const data = ev.data || {};

      switch (ev.type) {
        case 'JobCreated':
          this.jobId = data.jobId || this.jobId;
          this.requestId = data.requestId || this.requestId;
          this.quotationId = data.quotationId || this.quotationId || null;
          this.changeRequestId = data.changeRequestId || this.changeRequestId || null;
          this.jobDetails = data.jobDetails || this.jobDetails || {};
          this.status = data.status || this.status || 'Pending';
          // sync assignedTeam
          if (!this.jobDetails.assignedTeam && data.assignedTeam) {
            this.jobDetails.assignedTeam = data.assignedTeam;
          }
          this.assignedTeam = this.jobDetails.assignedTeam || this.assignedTeam || null;
          break;

        case 'JobStarted':
          this.status = data.status || 'Started';
          this.assignedTeam = data.assignedTeam || data.jobDetails?.assignedTeam || this.assignedTeam;
          if (!this.jobDetails) this.jobDetails = {};
          if (this.assignedTeam) this.jobDetails.assignedTeam = this.assignedTeam;
          break;

        case 'JobCompleted':
          this.status = 'Completed';
          if (data.completedAt) this.completedAt = data.completedAt;
          if (data.completedByUserId) this.completedByUserId = data.completedByUserId;
          break;

        case 'JobOnHold':
          this.status = 'OnHold';
          this.onHoldReason = data.reason || this.onHoldReason;
          break;

        case 'ChangeRequestReceivedPendingAssessment':
          this.status = 'ChangeRequestReceivedPendingAssessment';
          break;

        default:
          // ignore unknown events
      }
      console.log(`[JobStateReconstructor] Processed event: ${ev.type} for jobId: ${this}`);
    }
  }
}

/**
 * Reconstruct (replay) final job state for a given jobId using events in jobEventStore.
 * Returns a plain object containing the fields your tests expect.
 */
export const reconstructJobState = (jobId) => {
  // get events (sorted)
  const allEvents = (jobEventStore.getEvents() || []).slice().sort((a, b) =>
    new Date(a.metadata?.timestamp || a.timestamp || 0).getTime() - new Date(b.metadata?.timestamp || b.timestamp || 0).getTime()
  );

  // filter for the given jobId (tolerate events that put id in different places)
  const jobEvents = allEvents.filter(ev => {
    const d = ev.data || {};
    return d.jobId === jobId
      || ev.aggregateId === jobId
      || (d.job && d.job.jobId === jobId); // extra tolerance
  });

  const reconstructor = new JobStateReconstructor();
  reconstructor.replay(jobEvents);

  return {
    jobId: reconstructor.jobId,
    requestId: reconstructor.requestId,
    status: reconstructor.status,
    assignedTeam: reconstructor.assignedTeam,
    quotationId: reconstructor.quotationId,
    changeRequestId: reconstructor.changeRequestId,
    jobDetails: reconstructor.jobDetails,
    onHoldReason: reconstructor.onHoldReason,
    completedAt: reconstructor.completedAt,
    completedByUserId: reconstructor.completedByUserId
  };
};

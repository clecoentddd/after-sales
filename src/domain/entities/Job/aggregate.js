import { v4 as uuidv4 } from 'uuid';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { JobStartedEvent } from '../../events/jobStartedEvent';
import { JobCompletedEvent } from '../../events/jobCompletedEvent';
import { JobOnHoldEvent } from '../../events/jobOnHoldEvent';
import { JobFlaggedForAssessmentEvent } from '../../events/jobFlaggedForAssessmentEvent';
import { jobEventStore } from '../../core/eventStore';

// Job Aggregate Class
export class JobAggregate {
  constructor() {
    this.status = 'NotCreated';
    this.jobId = null;
    this.customerId = null;
    this.requestId = null;
    this.quotationId = null;
    this.jobDetails = {};
  }

  /**
   * Rebuilds the aggregate state from past events.
   * @param {Array} events - All domain events related to this job.
   */
  replay(events) {
    events.forEach(event => {
      switch (event.type) {
        case 'JobCreated':
          this.jobId = event.data.jobId;
          this.requestId = event.data.requestId;
          this.status = 'Pending';
          break;
        case 'JobStarted':
          this.status = 'Started';
          this.assignedTeam = event.data.assignedTeam;
          break;
        case 'JobCompleted':
          this.status = 'Completed';
          break;
        case 'JobOnHold':
          this.status = 'OnHold';
          this.onHoldReason = event.data.reason;
          break;
        case 'ChangeRequestReceivedPendingAssessment':
          this.status = 'ChangeRequestReceivedPendingAssessment';
          break;
      }
    });
  }

  static createFromQuotationApproval(customerId, requestId, quotationId, requestDetails) {
    console.log(`[JobAggregate] Creating job from approved quotation: ${quotationId}`);
    const jobDetails = {
      title: `Repair Job for: ${requestDetails.title}`,
      description: `Initiated from approved quotation for request: ${requestDetails.description || 'No description'}`,
      priority: 'Normal',
      assignedTeam: 'Unassigned'
    };
    return JobCreatedEvent(
      uuidv4(),
      customerId,
      requestId,
      quotationId,
      jobDetails,
      'Pending'
    );
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

  /**
   * Flags a job for assessment if a change request is raised and job is already started.
   * @param {object} command - FlagJobForAssessmentCommand
   * @returns {object|null} Event or null if invalid state
   */
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

// Job State Reconstructor Class
class JobStateReconstructor {
  constructor() {
    this.jobId = null;
    this.requestId = null;
    this.status = null;
    this.assignedTeam = null;
    this.onHoldReason = null;
  }

  replay(events) {
    events.forEach(event => {
      switch (event.type) {
        case 'JobCreated':
          this.jobId = event.data.jobId;
          this.requestId = event.data.requestId;
          this.status = 'Pending';
          break;
        case 'JobStarted':
          this.status = 'Started';
          this.assignedTeam = event.data.assignedTeam;
          break;
        case 'JobCompleted':
          this.status = 'Completed';
          break;
        case 'JobOnHold':
          this.status = 'OnHold';
          this.onHoldReason = event.data.reason;
          break;
        case 'ChangeRequestReceivedPendingAssessment':
          this.status = 'ChangeRequestReceivedPendingAssessment';
          break;
      }
    });
  }
}

export const reconstructJobState = (jobId) => {
  const allEvents = jobEventStore.getEvents().sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const jobEvents = allEvents.filter(event => event.data.jobId === jobId);

  const jobStateReconstructor = new JobStateReconstructor();
  jobStateReconstructor.replay(jobEvents);

  return {
    jobId: jobStateReconstructor.jobId,
    requestId: jobStateReconstructor.requestId,
    status: jobStateReconstructor.status,
    assignedTeam: jobStateReconstructor.assignedTeam,
    onHoldReason: jobStateReconstructor.onHoldReason
  };
};

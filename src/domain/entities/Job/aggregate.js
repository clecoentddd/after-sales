// src/domain/entities/Job/aggregate.js

import { v4 as uuidv4 } from 'uuid';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';
import { JobStartedEvent } from '../../events/jobStartedEvent';
import { JobCompletedEvent } from '../../events/jobCompletedEvent';
import { JobOnHoldEvent } from '../../events/jobOnHoldEvent';

export class JobAggregate {
  constructor() {
    this.status = 'NotCreated';
    this.jobId = null;
    this.customerId = null;
    this.requestId = null;
    this.quoteId = null;
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
        // Add other cases as needed (e.g., JobOnHold)
      }
    });
  }

  /**
   * Factory method to create a new job based on a quote approval.
   */
  static createFromQuoteApproval(customerId, requestId, quoteId, requestDetails) {
    console.log(`[JobAggregate] Creating job from approved quote: ${quoteId}`);

    const jobDetails = {
      title: `Repair Job for: ${requestDetails.title}`,
      description: `Initiated from approved quote for request: ${requestDetails.description || 'No description'}`,
      priority: 'Normal',
      assignedTeam: 'Unassigned'
    };

    return JobCreatedEvent(
      uuidv4(),
      customerId,
      requestId,
      quoteId,
      jobDetails,
      'Pending'
    );
  }

  /**
   * Starts a job if not already started or completed.
   */
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

  /**
   * Completes a job if it is currently started.
   */
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

  return {
    type: 'JobOnHold',
    data: {
      jobId: command.jobId,
      requestId: this.requestId,            // <-- use hydrated requestId here
      changeRequestId: command.changeRequestId,
      putOnHoldBy: command.heldByUserId,
      reason: command.reason,
      onHoldAt: new Date().toISOString(),
      status: 'OnHold',
    },
    metadata: {
      timestamp: new Date().toISOString(),
    }
  };
}

}
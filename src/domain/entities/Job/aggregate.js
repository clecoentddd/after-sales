// src/domain/entities/Job/aggregate.js

import { v4 as uuidv4 } from 'uuid';
import { JobCreatedEvent } from '../../events/jobCreatedEvent';

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
   * Rebuilds the aggregate state from historical events.
   * @param {Array} events - Event history for the job
   */
  replay(events) {
    console.log(`[JobAggregate] Replaying ${events.length} events...`);
    events.forEach(event => {
      if (event.type === 'JobCreated') {
        this.status = event.data.status;
        this.jobId = event.data.jobId;
        this.customerId = event.data.customerId;
        this.requestId = event.data.requestId;
        this.quoteId = event.data.quoteId;
        this.jobDetails = event.data.jobDetails;
      }
    });
  }

  /**
   * Static factory: create a new job from an approved quote.
   * @param {string} customerId 
   * @param {string} requestId 
   * @param {string} quoteId 
   * @param {object} requestDetails 
   * @returns {object} JobCreatedEvent
   */
  static createFromQuoteApproval(customerId, requestId, quoteId, requestDetails) {
    console.log(`[JobAggregate] Creating job from approved quote: ${quoteId}`);

    const jobDetails = {
      title: `Repair Job for: ${requestDetails.title}`,
      description: `Initiated from approved quote for request: ${requestDetails.description || 'No description provided.'}`,
      priority: 'Normal',
      assignedTeam: 'Unassigned'
    };

    return JobCreatedEvent(
      uuidv4(),     // jobId
      customerId,
      requestId,
      quoteId,
      jobDetails,
      'Pending'     // initial status
    );
  }
}

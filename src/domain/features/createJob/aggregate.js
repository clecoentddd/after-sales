// repair/aggregate.js
// Defines the JobAggregate, responsible for creating Repair Job events.

import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { JobCreatedEvent } from './events'; // Import the JobCreatedEvent

export class JobAggregate {
  /**
   * Static method to create a new repair job from a quote approval, emitting a JobCreatedEvent.
   * This method acts as a factory for the JobCreatedEvent based on incoming data from the approved quote and related request/customer.
   * @param {string} customerId - The ID of the customer for this job.
   * @param {string} requestId - The ID of the original request.
   * @param {string} quoteId - The ID of the approved quote.
   * @param {object} requestDetails - Details from the original request (e.g., title, description).
   * @returns {object} A JobCreatedEvent.
   */
  static createFromQuoteApproval(customerId, requestId, quoteId, requestDetails) {
    console.log(`[JobAggregate] Creating job from approved quote: ${quoteId}`);
    
    // Here you would typically determine specific job details based on the request and quote.
    const jobDetails = {
      title: `Repair Job for: ${requestDetails.title}`,
      description: `Initiated from approved quote for request: ${requestDetails.description || 'No description provided.'}`,
      priority: 'Normal', // Default priority, could be derived from request or quote
      assignedTeam: 'Unassigned' // Initial assignment status
    };

    return JobCreatedEvent(
      uuidv4(), // Generate a unique ID for the new job
      customerId,
      requestId,
      quoteId,
      jobDetails,
      'Pending' // Initial status for a new job
    );
  }
  // Future methods for updating job details, scheduling, or completing jobs would go here.
}

// request/aggregate.js
// Defines the RequestAggregate, responsible for creating Request-related events.

import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { RequestCreatedEvent } from './events'; // Import the RequestCreatedEvent

export class RequestAggregate {
  /**
   * Static method to create a new request, emitting a RequestCreatedEvent.
   * This method takes a command and transforms it into an event.
   * @param {object} command - The command object (e.g., CreateRequestCommand).
   * @param {string} command.customerId - The ID of the customer associated with this request.
   * @param {object} command.requestDetails - Details about the request.
   * @returns {object} A RequestCreatedEvent.
   */
  static create(command) {
    console.log(`[RequestAggregate] Creating request from command:`, command);
    return RequestCreatedEvent(
      uuidv4(), // Generate a unique ID for the new request
      command.customerId,
      command.requestDetails,
      'Pending' // Initial status for a new request
    );
  }
}

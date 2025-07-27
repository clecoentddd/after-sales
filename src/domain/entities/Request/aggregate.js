import { RequestCreatedEvent } from '../../events/requestCreateEvent';

export class RequestAggregate {
  /**
   * Create a new request event from the given command.
   * @param {object} command - The command object.
   * @param {string} command.requestId - The request UUID generated outside.
   * @param {string} command.customerId - Customer ID.
   * @param {object} command.requestDetails - Details of the request.
   * @returns {object} RequestCreatedEvent
   */
  static create(command) {
    console.log(`[RequestAggregate] Creating request from command:`, command);
    return RequestCreatedEvent(
      command.requestId,      // Use UUID passed by command handler
      command.customerId,
      command.requestDetails,
      'Pending'               // Initial status
    );
  }
}

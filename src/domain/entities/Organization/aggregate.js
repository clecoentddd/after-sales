// src/domain/entities/organization/aggregate.js

import { organizationCreatedEvent } from '../../events/organizationCreatedEvent';

export class organizationAggregate {
  /**
   * Creates an organizationCreatedEvent based on the command.
   * Assumes the UUID is already generated in the commandHandler.
   * @param {object} command - Command containing the ID and name.
   * @returns {object} organizationCreatedEvent
   */
  static create(command) {
   return organizationCreatedEvent(
   command.organizationId, // now passed from outside
   command.name
   );
 }
}

// src/domain/entities/organization/aggregate.js

import { OrganizationCreatedEvent } from '../../events/organizationCreatedEvent';

export class OrganizationAggregate {
  /**
   * Creates an OrganizationCreatedEvent based on the command.
   * Assumes the UUID is already generated in the commandHandler.
   * @param {object} command - Command containing the ID and name.
   * @returns {object} OrganizationCreatedEvent
   */
  static create(command) {
   return OrganizationCreatedEvent(
   command.organizationId, // now passed from outside
   command.name
   );
 }
}

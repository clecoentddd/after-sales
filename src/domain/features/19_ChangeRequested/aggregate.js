// src/domain/features/changeRequested/aggregate.js
// Defines the ChangeRequestAggregate, responsible for creating ChangeRequestRaisedEvent.

import { ChangeRequestRaisedEvent } from './events';

export class ChangeRequestAggregate {
  /**
   * Static method to process a RaiseChangeRequestCommand, emitting a ChangeRequestRaisedEvent.
   * @param {object} command - The command object (e.g., RaiseChangeRequestCommand).
   * @param {string} command.requestId - The ID of the request against which change is raised.
   * @param {string} command.changedByUserId - The ID of the user raising the change.
   * @param {string} command.description - Description of the change.
   * @returns {object} A ChangeRequestRaisedEvent.
   */
  static raiseChangeRequest(command) {
    console.log(`[ChangeRequestAggregate] Raising change request for request ${command.requestId}`);
    return ChangeRequestRaisedEvent(
      command.requestId,
      command.changedByUserId,
      command.description
    );
  }
}

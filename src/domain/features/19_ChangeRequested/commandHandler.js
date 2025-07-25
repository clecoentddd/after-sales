// src/domain/features/changeRequested/commandHandler.js
// Handles commands related to raising a change request.

import { eventBus } from '../../core/eventBus';
import { changeRequestEventStore } from '../../core/eventStore'; // Event for change request goes here
import { ChangeRequestAggregate } from './aggregate';

export const changeRequestCommandHandler = {
  /**
   * Handles incoming commands for the Change Request domain.
   * @param {object} command - The command object to handle.
   * @param {string} command.type - The type of the command (e.g., 'RaiseChangeRequest').
   * @returns {object} An object indicating success and optionally the generated event.
   */
  handle(command) {
    console.log(`[ChangeRequestCommandHandler] Handling command: ${command.type}`, command);
    switch (command.type) {
      case 'RaiseChangeRequest':
        const event = ChangeRequestAggregate.raiseChangeRequest(command);
        changeRequestEventStore.append(event); // Append ChangeRequestRaisedEvent to its dedicated store
        eventBus.publish(event); // Publish ChangeRequestRaisedEvent
        return { success: true, event };

      default:
        console.warn(`[ChangeRequestCommandHandler] Unknown command type: ${command.type}`);
        return { success: false };
    }
  }
};

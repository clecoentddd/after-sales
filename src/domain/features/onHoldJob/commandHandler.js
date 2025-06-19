// src/domain/features/onHoldJob/commandHandler.js
// Handles commands related to putting a job on hold.

import { eventBus } from '../../core/eventBus';
import { onHoldJobEventStore } from '../../core/eventStore'; // Event for job on hold goes here
import { OnHoldJobAggregate } from './aggregate';

export const onHoldJobCommandHandler = {
  /**
   * Handles incoming commands for the On Hold Job domain.
   * @param {object} command - The command object to handle.
   * @param {string} command.type - The type of the command (e.g., 'PutJobOnHold').
   * @returns {object} An object indicating success and optionally the generated event.
   */
  handle(command) {
    console.log(`[OnHoldJobCommandHandler] Handling command: ${command.type}`, command);
    switch (command.type) {
      case 'PutJobOnHold':
        const event = OnHoldJobAggregate.putOnHold(command);
        onHoldJobEventStore.append(event); // Append JobOnHoldEvent to its dedicated store
        eventBus.publish(event); // Publish JobOnHoldEvent
        return { success: true, event };

      default:
        console.warn(`[OnHoldJobCommandHandler] Unknown command type: ${command.type}`);
        return { success: false };
    }
  }
};

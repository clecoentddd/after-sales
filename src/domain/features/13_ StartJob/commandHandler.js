// startJob/commandHandler.js
// Handles commands related to starting a repair job.

import { eventBus } from '../../core/eventBus';
import { jobEventStore } from '../../core/eventStore'; // JobStartedEvent goes into jobCreatjobEventStore
import { StartJobAggregate } from './aggregate'; // Use the new StartJobAggregate

export const startJobCommandHandler = {
  /**
   * Handles incoming commands for the Start Job domain.
   * @param {object} command - The command object to handle.
   * @param {string} command.type - The type of the command (e.g., 'StartJob').
   * @returns {object} An object indicating success and optionally the generated event.
   */
  handle(command) {
    console.log(`[StartJobCommandHandler] Handling command: ${command.type}`, command);
    switch (command.type) {
      case 'StartJob':
        const event = StartJobAggregate.start(command);
        jobEventStore.append(event);
        eventBus.publish(event);
        return { success: true, event };

      default:
        console.warn(`[StartJobCommandHandler] Unknown command type: ${command.type}`);
        return { success: false };
    }
  }
};

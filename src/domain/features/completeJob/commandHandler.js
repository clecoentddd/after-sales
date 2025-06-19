// completeJob/commandHandler.js
// Handles commands related to completing a repair job.

import { eventBus } from '../../core/eventBus';
import { jobCompletionEventStore } from '../../core/eventStore'; // Event for job completion goes here
import { CompleteJobAggregate } from './aggregate';

export const completeJobCommandHandler = {
  /**
   * Handles incoming commands for the Complete Job domain.
   * @param {object} command - The command object to handle.
   * @param {string} command.type - The type of the command (e.g., 'CompleteJob').
   * @returns {object} An object indicating success and optionally the generated event.
   */
  handle(command) {
    console.log(`[CompleteJobCommandHandler] Handling command: ${command.type}`, command);
    switch (command.type) {
      case 'CompleteJob':
        const event = CompleteJobAggregate.complete(command);
        jobCompletionEventStore.append(event); // Append JobCompletedEvent to its dedicated store
        eventBus.publish(event); // Publish JobCompletedEvent
        return { success: true, event };

      default:
        console.warn(`[CompleteJobCommandHandler] Unknown command type: ${command.type}`);
        return { success: false };
    }
  }
};

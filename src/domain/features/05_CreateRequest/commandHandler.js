// request/commandHandler.js
// Handles commands related to the Request domain.

import { eventBus } from '../../core/eventBus'; // Import the global event bus
import { requestEventStore } from '../../core/eventStore'; // Import the request-specific event store
import { RequestAggregate } from './aggregate'; // Import the RequestAggregate

export const requestCommandHandler = {
  /**
   * Handles incoming commands for the Request domain.
   * @param {object} command - The command object to handle.
   * @param {string} command.type - The type of the command (e.g., 'CreateRequest').
   * @returns {object} An object indicating success and optionally the generated event.
   */
  handle(command) {
    console.log(`[RequestCommandHandler] Handling command: ${command.type}`, command);
    switch (command.type) {
      case 'CreateRequest':
        // Delegate to the RequestAggregate to create the event.
        const event = RequestAggregate.create(command);
        // Append the event to the request event store for persistence.
        requestEventStore.append(event);
        // Publish the event to the event bus so other parts of the system can react.
        eventBus.publish(event);
        return { success: true, event };

      default:
        // Log a warning for unknown command types.
        console.warn(`[RequestCommandHandler] Unknown command type: ${command.type}`);
        return { success: false };
    }
  }
};

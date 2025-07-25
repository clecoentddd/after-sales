// approval/commandHandler.js
// Handles commands related to the Quote Approval domain.

import { eventBus } from '../../core/eventBus';
import { quotationEventStore } from '../../core/eventStore'; // Import the new event store
import { QuoteApprovalAggregate } from './aggregate';

export const quoteApprovalCommandHandler = {
  /**
   * Handles incoming commands for the Quote Approval domain.
   * @param {object} command - The command object to handle.
   * @param {string} command.type - The type of the command (e.g., 'ApproveQuote').
   * @returns {object} An object indicating success and optionally the generated event.
   */
  handle(command) {
    console.log(`[QuoteApprovalCommandHandler] Handling command: ${command.type}`, command);
    switch (command.type) {
      case 'ApproveQuote':
        // Delegate to the QuoteApprovalAggregate to create the event.
        const event = QuoteApprovalAggregate.approve(command);
        // Append the event to the quote approval event store for persistence.
        quotationEventStore.append(event);
        // Publish the event to the event bus so other parts of the system can react.
        eventBus.publish(event);
        return { success: true, event };

      default:
        console.warn(`[QuoteApprovalCommandHandler] Unknown command type: ${command.type}`);
        return { success: false };
    }
  }
};

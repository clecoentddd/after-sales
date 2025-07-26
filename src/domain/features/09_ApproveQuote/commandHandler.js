// Handles commands related to the Quote Approval domain.

import { eventBus } from '../../core/eventBus';
import { quotationEventStore } from '../../core/eventStore';
import { QuoteApprovalAggregate } from './aggregate';
import { ApproveQuoteCommand } from './commands'; // Import the command class

export const quoteApprovalCommandHandler = {
  /**
   * Handles incoming commands for the Quote Approval domain.
   * @param {ApproveQuoteCommand} command - The ApproveQuoteCommand to handle.
   * @returns {object} An object indicating success and optionally the generated event.
   */
  handle(command) {
    console.log(`[QuoteApprovalCommandHandler] Handling command: ${command.type}`, command);

    switch (command.type) {
      case 'ApproveQuote':
        // Load all events related to this quote
        const events = quotationEventStore
          .getEvents()
          .filter(e => e.data.quoteId === command.quoteId);

        // Create and hydrate the aggregate
        const aggregate = new QuoteApprovalAggregate();
        aggregate.replay(events);

        // Let the aggregate handle the command
        const event = aggregate.approve(command);
        if (!event) {
          return {
            success: false,
            message: `Quote ${command.quoteId} is already approved.`,
            code: 'QUOTE_ALREADY_APPROVED',
            quoteId: command.quoteId,
            requestId: command.requestId,
          };
        }

        // Persist and publish the event
        quotationEventStore.append(event);
        eventBus.publish(event);

        return { success: true, event };

      default:
        console.warn(`[QuoteApprovalCommandHandler] Unknown command type: ${command.type}`);
        return { success: false, message: `Unknown command type: ${command.type}` };
    }
  }
};

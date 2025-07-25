// approval/aggregate.js
// Defines the QuoteApprovalAggregate, responsible for creating Quote Approval events.

import { QuoteApprovedEvent } from './events'; // Import the QuoteApprovedEvent

export class QuoteApprovalAggregate {
  /**
   * Static method to process an ApproveQuoteCommand, emitting a QuoteApprovedEvent.
   * In a real system, this might involve checking permissions, quote status, etc.
   * For this example, it simply records the approval.
   * @param {object} command - The command object (e.g., ApproveQuoteCommand).
   * @param {string} command.quoteId - The ID of the quotation to approve.
   * @param {string} command.userId - The ID of the user who approved the quotation.
   * @returns {object} A QuoteApprovedEvent.
   */
  static approve(command) {
    console.log(`[QuoteApprovalAggregate] Approving quote from command:`, command);
    return QuoteApprovedEvent(
      command.quoteId,
      command.userId
    );
  }
}

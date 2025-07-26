// src/domain/features/09_ApproveQuote/aggregate.js
import { QuoteApprovedEvent } from './events';

export class QuoteApprovalAggregate {
  constructor() {
    this.status = 'Pending'; // initial state
    this.requestId = null;   // initialize requestId to null
  }

  /**
   * Replay events to reconstruct the aggregate state
   * @param {Array} events - List of past events related to the quote
   */
  replay(events) {
    console.log('[QuoteApprovalAggregate] Replaying events:', events.length);
    events.forEach(event => {
      console.log(`[QuoteApprovalAggregate] Processing event type: ${event.type}`, event.data);
      switch (event.type) {
        case 'QuotationCreated':
          this.requestId = event.data.requestId;
          console.log(`[QuoteApprovalAggregate] Set requestId to: ${this.requestId} from QuotationCreated`);
          break;
        case 'QuoteApproved':
          this.status = 'Approved';
          this.requestId = event.data.requestId; // redundant but okay for safety
          console.log(`[QuoteApprovalAggregate] Status set to Approved; requestId: ${this.requestId}`);
          break;
        case 'QuotationOnHold':
          this.status = 'On Hold';
          this.requestId = event.data.requestId;
          console.log(`[QuoteApprovalAggregate] Status set to On Hold; requestId: ${this.requestId}`);
          break;
        default:
          console.log(`[QuoteApprovalAggregate] Unhandled event type: ${event.type}`);
          break;
      }
    });
    console.log(`[QuoteApprovalAggregate] Replay complete. Status: ${this.status}, requestId: ${this.requestId}`);
  }

  /**
   * Handle the approve command and emit event if valid
   * @param {ApproveQuoteCommand} command
   * @returns {object|null} QuoteApprovedEvent or null if already approved
   */
  approve(command) {
    if (this.status === 'Approved') {
      console.warn(`[QuoteApprovalAggregate] Quote ${command.quoteId} is already approved.`);
      return null;
    }
    console.log(`[QuoteApprovalAggregate] Approving quoteId ${command.quoteId} with requestId ${this.requestId} by user ${command.userId}`);
    return QuoteApprovedEvent(command.quoteId, this.requestId, command.userId);
  }
}

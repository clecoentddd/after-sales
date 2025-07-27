// quotation/aggregate.js
import { QuotationCreatedEvent } from '../../events/quotationCreatedEvent';
import { QuotationApprovedEvent } from '../../events/quotationApprovedEvent'; // import from approval feature

export class QuotationAggregate {
  constructor() {
    this.status = 'Pending';     // Initial status
    this.requestId = null;
    this.quotationId = null;
  }

  /**
   * Replay historical events to rebuild the aggregate state
   * @param {Array} events - Domain events related to this quotation
   */
  replay(events) {
    console.log('[QuotationAggregate] Replaying events:', events.length);
    events.forEach(event => {
      switch (event.type) {
        case 'QuotationCreated':
          this.status = event.data.status || 'Draft';
          this.requestId = event.data.requestId;
          this.quotationId = event.data.quotationId;
          break;
        case 'QuotationApproved':
          this.status = 'Approved';
          break;
        case 'QuotationOnHold':
          this.status = 'OnHold';
          break;
        default:
          console.log(`[QuotationAggregate] Unknown event: ${event.type}`);
      }
    });
  }

  /**
   * Factory method to create a new quotation
   * @param {object} command - CreateQuotationCommand
   * @returns {object} QuotationCreatedEvent
   */
  static create(command) {
    console.log(`[QuotationAggregate] Creating quotation from request: ${command.requestId}`);

    const quotationDetails = {
      title: `Quotation for: ${command.requestDetails.title}`,
      estimatedAmount: (Math.random() * 1000 + 500).toFixed(2),
      currency: 'USD',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    return QuotationCreatedEvent(
      command.quotationId,
      command.requestId,
      command.customerId,
      quotationDetails,
      'Draft'
    );
  }

  /**
   * Command handler to approve a quotation
   * @param {object} command - ApproveQuotationCommand
   * @returns {object|null} QuotationApprovedEvent or null if already approved
   */
  approve(command) {
    if (this.status === 'Approved') {
      console.warn(`[QuotationAggregate] Quotation ${command.quotationId} is already approved.`);
      return null;
    }

    console.log(`[QuotationAggregate] Approving quotationId ${command.quotationId} by user ${command.userId}`);
    return QuotationApprovedEvent(command.quotationId, this.requestId, command.userId);
  }
}

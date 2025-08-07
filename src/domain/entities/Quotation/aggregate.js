import { QuotationCreatedEvent } from '@events/quotationCreatedEvent';
import { QuotationApprovedEvent } from '@events/quotationApprovedEvent';

export class QuotationAggregate {
  constructor({
    quotationId,
    requestId,
    changeRequestId,
    customerId,
    quotationDetails,
    status = 'Draft',
  }) {
    console.log('[QuotationAggregate] Constructor called with:', {
      quotationId,
      requestId,
      changeRequestId,
      customerId,
      quotationDetails,
      status,
    });

    this.quotationId = quotationId;
    this.requestId = requestId;
    this.changeRequestId = changeRequestId;
    this.customerId = customerId;
    this.quotationDetails = quotationDetails;
    this.status = status;
  }

  static replay(events) {
    console.log('[QuotationAggregate] Replay called with events:', events);

    if (!Array.isArray(events) || events.length === 0) {
      throw new Error('[QuotationAggregate] No events provided for replay');
    }

    let aggregate = null;

    const sorted = [...events].sort((a, b) => {
      const t1 = new Date(a.metadata?.timestamp || a.timestamp).getTime();
      const t2 = new Date(b.metadata?.timestamp || b.timestamp).getTime();
      return t1 - t2;
    });

    console.log('[QuotationAggregate] Events sorted by timestamp:', sorted);

    for (const event of sorted) {
      console.log(`[QuotationAggregate] Applying event type: ${event.type}, aggregateId: ${event.aggregateId}`);

      switch (event.type) {
        case 'QuotationCreated': {
          const {
            requestId,
            changeRequestId,
            customerId,
            quotationDetails,
            status,
          } = event.data;

          console.log('[QuotationAggregate] Creating aggregate from QuotationCreated event:', {
            aggregateId: event.aggregateId,
            requestId,
            changeRequestId,
            customerId,
            quotationDetails,
            status,
          });

          aggregate = new QuotationAggregate({
            quotationId: event.aggregateId,
            requestId,
            changeRequestId,
            customerId,
            quotationDetails,
            status,
          });
          break;
        }

        case 'QuotationApproved': {
          if (!aggregate) {
            throw new Error('[QuotationAggregate] Cannot apply QuotationApproved to null aggregate');
          }
          console.log('[QuotationAggregate] Setting status to Approved');
          aggregate.status = 'Approved';
          break;
        }

        default:
          console.warn(`[QuotationAggregate] Unknown event type during replay: ${event.type}`);
      }

      console.log('[QuotationAggregate] Aggregate state after event:', aggregate ? aggregate.getCurrentState() : 'null');
    }

    if (!aggregate) {
      throw new Error('[QuotationAggregate] Failed to initialize from events');
    }

    console.log('[QuotationAggregate] Replay finished. Final aggregate:', aggregate.getCurrentState());
    return aggregate;
  }

  approve(command) {
    console.log(`[QuotationAggregate] Approve called. Current status: ${this.status}`);

    if (this.status === 'Approved') {
      console.log('[QuotationAggregate] Already approved, returning null');
      return null;
    }

    const approvedEvent = QuotationApprovedEvent({
      quotationId: this.quotationId,
      requestId: this.requestId,
      changeRequestId: this.changeRequestId,
      approvedByUserId: command.userId,
      quotationDetails: this.quotationDetails,
    });

    console.log('[QuotationAggregate] Generated QuotationApprovedEvent:', approvedEvent);
    return approvedEvent;
  }

  static create(command) {
    console.log('[QuotationAggregate] Create called with command:', command);

    const createdEvent = QuotationCreatedEvent({
      quotationId: command.quotationId,
      requestId: command.requestId,
      changeRequestId: command.changeRequestId,
      customerId: command.customerId,
      quotationDetails: {
        title: command.title || 'Default Title',
        estimatedAmount: command.estimatedAmount || '1000.00',
        currency: 'USD',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'Draft',
    });

    console.log('[QuotationAggregate] Generated QuotationCreatedEvent:', createdEvent);
    return createdEvent;
  }

  getCurrentState() {
    const state = {
      quotationId: this.quotationId,
      requestId: this.requestId,
      changeRequestId: this.changeRequestId,
      customerId: this.customerId,
      quotationDetails: this.quotationDetails,
      status: this.status,
    };
    console.log('[QuotationAggregate] getCurrentState:', state);
    return state;
  }
}

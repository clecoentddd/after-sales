// quotation/aggregate.js
import { QuotationCreatedEvent } from '../../events/quotationCreatedEvent';
import { QuotationApprovedEvent } from '../../events/quotationApprovedEvent'; // import from approval feature


export class QuotationAggregate {
  id;
  quotationId;
  requestId;
  status;

  constructor(id, requestId, quotationId, status) {
    this.id = id;
    this.quotationId = quotationId;
    this.requestId = requestId;
    this.status = status;
  }

  static replay(events) {
    console.log('[QuotationAggregate] Replaying events: Initial events received:', events.length, events);
    if (events.length === 0) {
      console.log('[QuotationAggregate] No events to replay. Returning NOT_CREATED aggregate.');
      return new QuotationAggregate('NOT_CREATED', null, null, 'NOT_CREATED');
    }

    // Sort events by timestamp to ensure chronological order
    const sortedEvents = [...events].sort((a, b) => {
      const timestampA = new Date(a.timestamp || a.metadata?.timestamp).getTime();
      const timestampB = new Date(b.timestamp || b.metadata?.timestamp).getTime();
      return timestampA - timestampB;
    });
    console.log('[QuotationAggregate] Events sorted by timestamp for replay:', sortedEvents);

    let aggregate = null;
    let currentVersion = -1; 

    for (const event of sortedEvents) { // Iterate over sorted events
      currentVersion++;
      console.log(`[QuotationAggregate] Processing event type: ${event.type}, ID: ${event.id}, Timestamp: ${event.timestamp || event.metadata?.timestamp}`);

      switch (event.type) {
        case 'QuotationCreated':
          console.log('[QuotationAggregate] Applying QuotationCreatedEvent:', event);
          aggregate = new QuotationAggregate(
            event.aggregateId,
            event.data.requestId,
            event.data.quotationId,
            event.data.status || 'Draft' // Fixed typo: event.tatus to event.initialStatus
          );
          break;
        case 'QuotationApproved':
          console.log('[QuotationAggregate] Applying QuotationApproved event:', event);
          if (aggregate) {
            aggregate.status = 'Approved';
          } else {
            console.warn(`[QuotationAggregate] Skipping QuotationApproved event for uninitialized aggregate. Event ID: ${event.id}`);
          }
          break;
        case 'QuotationOnHold':
          console.log('[QuotationAggregate] Applying QuotationOnHold event:', event);
          if (aggregate) {
            aggregate.status = 'OnHold';
          } else {
            console.warn(`[QuotationAggregate] Skipping QuotationOnHold event for uninitialized aggregate. Event ID: ${event.id}`);
          }
          break;
        case 'QuotationRequalifiedEvent':
          console.log('[QuotationAggregate] Applying QuotationRequalifiedEvent event:', event);
          if (aggregate) {
            aggregate.status = 'Draft';
          } else {
            console.warn(`[QuotationAggregate] Skipping QuotationRequalifiedEvent event for uninitialized aggregate. Event ID: ${event.id}`);
          }
          break;
        default:
          console.log(`[QuotationAggregate] Unknown event type encountered during replay: ${event.type}. Event ID: ${event.id}`);
      }
      console.log('[QuotationAggregate] Aggregate state after event:', aggregate ? aggregate.getCurrentState() : 'null');
    }

    if (!aggregate) {
      console.error('[QuotationAggregate] Final check: Aggregate is still null after replaying all events. Missing QuotationCreatedEvent?');
      throw new Error('QuotationAggregate could not be replayed from events. Missing QuotationCreatedEvent or invalid event sequence.');
    }
    console.log('[QuotationAggregate] Replay complete. Final aggregate state:', aggregate.getCurrentState());
    return aggregate;
  }

  static create(command) {
    console.log(`[QuotationAggregate] Creating quotation from request: ${command.requestId}`);

    const quotationDetails = {
      title: `Quotation for: ${command.requestDetails.title} - Request ID: ${command.requestId}`,
      estimatedAmount: (Math.random() * 1000 + 500).toFixed(2),
      currency: 'USD',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const newEvent = QuotationCreatedEvent(
      command.quotationId,
      command.requestId,
      command.customerId,
      quotationDetails,
      'Draft'
    );
    console.log('[QuotationAggregate] Generated QuotationCreatedEvent:', newEvent);
    return newEvent;
  }

  approve(command) {
    console.log(`[QuotationAggregate] Attempting to approve quotation ${this.quotationId}. Current status: ${this.status}`);
    if (this.status === 'NOT_CREATED') {
      console.warn(`[QuotationAggregate] Cannot approve: Quotation ${command.quotationId} does not exist.`);
      throw new Error(`Quotation ${command.quotationId} does not exist.`);
    }

    if (this.status === 'Approved') {
      console.warn(`[QuotationAggregate] Quotation ${this.quotationId} is already approved. Returning null.`);
      return null;
    }

    console.log(`[QuotationAggregate] Approving quotationId ${this.quotationId} by user ${command.userId}`);
    const approvedEvent = QuotationApprovedEvent(command.quotationId, this.requestId, command.userId);
    console.log('[QuotationAggregate] Generated QuotationApprovedEvent:', approvedEvent);
    return approvedEvent;
  }

  getCurrentState() {
    console.log(`[QuotationAggregate] Getting current state for ${this.id}: ${this.status}`);
    return {
      id: this.id,
      quotationId: this.quotationId,
      requestId: this.requestId,
      status: this.status,
    };
  }
}

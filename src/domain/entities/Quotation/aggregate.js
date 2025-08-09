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
      console.log(`[QuotationAggregate] Applying event type: ${event.type}, aggregateId: ${event.metadata?.aggregateId || event.aggregateId}`);

      // Optional: enforce aggregateType check if you want safety
      if (event.metadata?.aggregateType && event.metadata.aggregateType !== 'Quotation') {
        throw new Error(`[QuotationAggregate] Unexpected aggregateType: ${event.metadata.aggregateType}`);
      }

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
            aggregateId: event.metadata?.aggregateId || event.aggregateId,
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

    // Generate random operations
const quotationOperations = generateRandomOperations();

// Calculate the total estimated amount from operations
const totalEstimatedAmount = quotationOperations.reduce((sum, operation) => sum + operation.amount, 0).toFixed(2);


    const createdEvent = QuotationCreatedEvent({
      quotationId: command.quotationId,
      requestId: command.requestId,
      changeRequestId: command.changeRequestId,
      customerId: command.customerId,
      quotationDetails: {
        title: command?.requestDetails?.title || 'Default Title - Should Request Title',
        estimatedAmount: totalEstimatedAmount,
        currency: 'CHF',
        operations: quotationOperations,
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

// Function to generate random operations
function generateRandomOperations() {
  const operationsList = [
    'Cleaning',
    'Polishing',
    'Disassembling',
    'Change Parts',
    'Inspection',
    'Lubrication',
    'Calibration',
    'Testing',
    'Painting',
    'Adjustment'
  ];

  // Randomly select 3 to 7 operations
  const numberOfOperations = Math.floor(Math.random() * 5) + 3;
  const selectedOperations = [];

  for (let i = 0; i < numberOfOperations; i++) {
    const randomIndex = Math.floor(Math.random() * operationsList.length);
    const operation = operationsList[randomIndex];

    // Ensure no duplicate operations
    if (!selectedOperations.some(op => op.operation === operation)) {
      const amount = (Math.random() * 1500 + 500).toFixed(2); // Random amount between 500 and 2000
      selectedOperations.push({
        operation,
        amount: parseFloat(amount) // Store as number for summation
      });
    }
  }

  return selectedOperations;
}

import { QuotationCreatedEvent } from '@events/quotationCreatedEvent';
import { QuotationApprovedEvent } from '@events/quotationApprovedEvent';

export class QuotationAggregate {
  constructor({ quotationId, requestId, changeRequestId, customerId, quotationDetails, status = 'Draft' }) {
    this.quotationId = quotationId;
    this.requestId = requestId;
    this.changeRequestId = changeRequestId;
    this.customerId = customerId;
    this.quotationDetails = quotationDetails;
    this.status = status;
  }

  static replay(events) {
    if (!Array.isArray(events) || events.length === 0) {
      throw new Error('No events provided for replay');
    }

    const sorted = [...events].sort((a, b) =>
      new Date(a.metadata?.timestamp || a.timestamp).getTime() -
      new Date(b.metadata?.timestamp || b.timestamp).getTime()
    );

    let aggregate = null;

    for (const event of sorted) {
      if (event.metadata?.aggregateType && event.metadata.aggregateType !== 'Quotation') {
        throw new Error(`Unexpected aggregateType: ${event.metadata.aggregateType}`);
      }

      switch (event.type) {
        case 'QuotationCreated': {
          const { customerId, quotationDetails, status } = event.data;
          aggregate = new QuotationAggregate({
            quotationId: event.aggregateId,
            requestId: event.requestId,
            changeRequestId: event.changeRequestId,
            customerId,
            quotationDetails,
            status,
          });
          break;
        }
        case 'QuotationApproved': {
          if (!aggregate) throw new Error('Cannot apply QuotationApproved to null aggregate');
          aggregate.status = 'Approved';
          break;
        }
        default:
          console.warn(`Unknown event type during replay: ${event.type}`);
      }
    }

    if (!aggregate) throw new Error('Failed to initialize from events');
    return aggregate;
  }

  approve(command) {
    if (this.status === 'Approved') return null;

    return QuotationApprovedEvent({
      quotationId: this.quotationId,
      requestId: this.requestId,
      changeRequestId: this.changeRequestId,
      approvedByUserId: command.userId,
      quotationDetails: this.quotationDetails,
    });
  }

  static create(command) {
    const quotationOperations = generateRandomOperations();
    const totalEstimatedAmount = quotationOperations.reduce((sum, operation) => sum + operation.amount, 0).toFixed(2);

    return QuotationCreatedEvent({
      quotationId: command.quotationId,
      requestId: command.requestId,
      changeRequestId: command.changeRequestId,
      customerId: command.customerId,
      quotationDetails: {
        title: command?.requestDetails?.title || 'Default Title',
        estimatedAmount: totalEstimatedAmount,
        currency: 'CHF',
        operations: quotationOperations,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'Draft',
    });
  }

  getCurrentState() {
    return {
      quotationId: this.quotationId,
      requestId: this.requestId,
      changeRequestId: this.changeRequestId,
      customerId: this.customerId,
      quotationDetails: this.quotationDetails,
      status: this.status,
    };
  }
}

function generateRandomOperations() {
  const operationsList = [
    'Cleaning', 'Polishing', 'Disassembling', 'Change Parts', 'Inspection',
    'Lubrication', 'Calibration', 'Testing', 'Painting', 'Adjustment'
  ];

  const numberOfOperations = Math.floor(Math.random() * 5) + 3;
  const selectedOperations = [];

  for (let i = 0; i < numberOfOperations; i++) {
    const operation = operationsList[Math.floor(Math.random() * operationsList.length)];
    if (!selectedOperations.some(op => op.operation === operation)) {
      const amount = (Math.random() * 1500 + 500).toFixed(2);
      selectedOperations.push({ operation, amount: parseFloat(amount) });
    }
  }

  return selectedOperations;
}

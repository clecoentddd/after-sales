// tests/quotationProjection.test.js
import { quotationEventStore } from '@core/eventStore';
import { buildQuotations } from '../domain/features/04_QuotationManagement/08_QuotationListProjection/useQuotationSlice.js.old';

// Helper to create a QuotationCreated event
const createQuotationCreatedEvent = (command) => ({
  type: 'QuotationCreated',
  aggregateId: command.quotationId,
  data: {
    quotationId: command.quotationId,
    requestId: command.requestId,
    changeRequestId: command.changeRequestId,
    customerId: command.customerId,
    title: command.requestDetails.title,
    description: command.requestDetails.description,
    status: 'Draft'
  },
  metadata: {
    aggregateId: command.quotationId,
    aggregateType: 'Quotation',
    timestamp: new Date().toISOString()
  }
});

describe('Quotation Projection', () => {
  beforeEach(() => {
    // Clear the store before each test
    quotationEventStore.clear();
  });

  it('should project a newly created quotation with the correct title', () => {
    // Step 1: Create the command
    const command = {
      type: 'CreateQuotation',
      quotationId: 'dfd90ff3-09bb-41e1-90db-c747bcc54a79',
      requestId: '50c9fa05-f1b6-4110-8909-d3a1dd3465bb',
      changeRequestId: '1303b1bb-1f16-4467-b079-7da1de74bc06',
      customerId: 'd8adb9b2-5ff1-4d70-9139-8d3dfc8899b4',
      requestDetails: {
        title: 'REQ1',
        description: 'test'
      }
    };

    // Step 2: Create the event
    const event = createQuotationCreatedEvent(command);

    // Step 3: Store the event in the event store
    quotationEventStore.append(event);

    // Step 4: Rebuild projection
    const { quotations } = buildQuotations();

    // Step 5: Assert projection contains our quotation with correct title
    expect(quotations.length).toBe(1);
    expect(quotations[0].quotationId).toBe(command.quotationId);
    expect(quotations[0].title).toBe('REQ1');
    expect(quotations[0].status).toBe('Draft');
  });
});

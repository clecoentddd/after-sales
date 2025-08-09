import { rebuildQuotationProjection } from '../../features/00_QuotationManagement/shared/rebuildQuotationProjection';
import { quotationEventStore } from '@core/eventStore';

describe('Quotation projection rebuild', () => {
  beforeEach(() => {
    // Clear the quotation event store before each test
    quotationEventStore.clearEvents?.();
  });

  it('should rebuild quotations projection from QuotationCreated and QuotationApproved events', async () => {
    // Prepare mock events
    const events = [
      {
        type: 'QuotationCreated',
        aggregateId: 'quote-1',
        data: {
          requestId: 'req-1',
          changeRequestId: 'chg-1',
          status: 'Draft',
        },
        metadata: { timestamp: new Date().toISOString() },
      },
      {
        type: 'QuotationCreated',
        aggregateId: 'quote-2',
        data: {
          requestId: 'req-2',
          changeRequestId: 'chg-2',
          status: 'Draft',
        },
        metadata: { timestamp: new Date().toISOString() },
      },
      {
        type: 'QuotationApproved',
        aggregateId: 'quote-1',
        data: {},
        metadata: { timestamp: new Date().toISOString() },
      },
      {
        type: 'QuotationOnHold',
        aggregateId: 'quote-2',
        data: {},
        metadata: { timestamp: new Date().toISOString() },
      },
    ];

    // Append events to the store
    events.forEach(event => quotationEventStore.append(event));

    // Rebuild projection (await promise)
    const quotations = await rebuildQuotationProjection();

    // Assertions
    expect(quotations).toHaveLength(2);

    expect(quotations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          quotationId: 'quote-1',
          requestId: 'req-1',
          changeRequestId: 'chg-1',
          status: 'Approved',
        }),
        expect.objectContaining({
          quotationId: 'quote-2',
          requestId: 'req-2',
          changeRequestId: 'chg-2',
          status: 'OnHold',
        }),
      ])
    );
  });
});

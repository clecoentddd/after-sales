// src/domain/features/onHoldQuotation/__tests__/onHoldQuotationCommandHandler.test.js

import { onHoldQuotationCommandHandler } from '../domain/features/21_PutQuotationOnHold/commandHandler';
import { PutQuotationOnHoldCommand } from '../domain/features/21_PutQuotationOnHold/commands';
import { quotationEventStore } from '../domain/core/eventStore';

describe('OnHoldQuotationCommandHandler', () => {
  beforeEach(() => {
    quotationEventStore.clear();
  });

  it('Given a quotation is already approved, when a change request is raised, then an error is returned', () => {
    // GIVEN
    const quoteId = 'quote-123';
    const requestId = 'request-456';
    const changeRequestId = 'cr-789';

    quotationEventStore.append({
      type: 'QuotationCreated',
      data: {
        quoteId,
        requestId,
        createdByUserId: 'user-1',
        status: 'Draft',
      },
      metadata: { timestamp: new Date().toISOString() },
    });

    quotationEventStore.append({
      type: 'QuoteApproved',
      data: {
        quoteId: quoteId,
        approvedByUserId: 'approver-1',
      },
      metadata: { timestamp: new Date().toISOString() },
    });

    // WHEN
    const command = PutQuotationOnHoldCommand(
      quoteId,
      requestId,
      changeRequestId,
      'system-user',
      'Change requested due to update'
    );

    const result = onHoldQuotationCommandHandler.handle(command);

    // THEN
    expect(result.success).toBe(false);
    expect(result.code).toBe('QUOTE_ALREADY_APPROVED');
    expect(result.message).toBe('Quotation is already approved and cannot be put on hold.');
    expect(result.quoteId).toBe(quoteId);
    expect(result.changeRequestId).toBe(changeRequestId);
  });
});

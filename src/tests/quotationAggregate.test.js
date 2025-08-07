import { QuotationCreatedEvent } from '@events/quotationCreatedEvent';
import { QuotationApprovedEvent } from '@events/quotationApprovedEvent';
import { QuotationAggregate } from '@entities/Quotation/aggregate';

describe('QuotationAggregate Create + Approve Replay Test', () => {
  it('should rebuild the aggregate correctly after QuotationCreated event, then update status after QuotationApproved event', () => {
    const quotationId = 'quote-123';
    const requestId = 'req-456';
    const changeRequestId = 'change-789';
    const customerId = 'cust-002';
    const userId = 'user-001';

    const quotationDetails = {
      title: 'Simple Test Quotation',
      estimatedAmount: '1000.00',
      currency: 'USD',
      validUntil: '2025-12-31',
    };

    // Step 1: Create the QuotationCreated event
    const createdEvent = QuotationCreatedEvent({
      quotationId,
      requestId,
      changeRequestId,
      customerId,
      quotationDetails,
      status: 'Draft',
    });

    // Replay only the creation event
    const aggregateAfterCreate = QuotationAggregate.replay([createdEvent]);

    expect(aggregateAfterCreate.quotationId).toBe(quotationId);
    expect(aggregateAfterCreate.status).toBe('Draft');

    // Step 2: Create the QuotationApproved event
    const approvedEvent = QuotationApprovedEvent({
      quotationId,
      requestId,
      changeRequestId,
      approvedByUserId: userId,
    });

    // Replay both events in order
    const aggregateAfterApprove = QuotationAggregate.replay([createdEvent, approvedEvent]);

    expect(aggregateAfterApprove.quotationId).toBe(quotationId);
    expect(aggregateAfterApprove.status).toBe('Approved');  // Status should be updated
  });
});

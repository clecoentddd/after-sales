import { eventBus } from '@core/eventBus';
import { quotationEventStore } from '@core/eventStore';
import { QuotationCreatedEvent } from '@events/quotationCreatedEvent';
import { initializeCreateJobEventHandler } from '../domain/features/05_JobManagement/0501_CreateJobAutomation/eventHandler';

import { quotationApprovalCommandHandler } from '../domain/features/04_QuotationManagement/09_ApproveQuotation/commandHandler';

// Mock dat
const quotationId = 'quote-123';
const requestId = 'req-456';
const changeRequestId = 'change-789';
const userId = 'user-001';
const customerId = 'cust-002';

const quotationDetails = {
  title: 'Integration Test Quotation',
  estimatedAmount: '2000.00',
  currency: 'USD',
  validUntil: '2025-12-31',
};

describe('QuotationApprovalCommandHandler Integration Test', () => {
  beforeEach(() => {
    // Clear event store and eventBus subscriptions before each test
    quotationEventStore.clear();
    initializeCreateJobEventHandler();
  });

  it('should publish enriched QuotationApproved event after approval command', done => {
    // Step 1: Create and store QuotationCreated event in eventStore
    const createdEvent = QuotationCreatedEvent({
      quotationId,
      requestId,
      changeRequestId,
      customerId,
      quotationDetails,
      status: 'Draft',
    });
    quotationEventStore.append(createdEvent);

    // Step 2: Subscribe to eventBus to catch enriched event
    eventBus.subscribe('QuotationApproved', enrichedEvent => {
      try {
        console.log('[Test] Received QuotationApproved event:', enrichedEvent);
        expect(enrichedEvent.type).toBe('QuotationApproved');
        expect(enrichedEvent.quotationId).toBe(quotationId);
        expect(enrichedEvent.data.requestId).toBe(requestId);
        expect(enrichedEvent.data.approvedByUserId).toBe(userId);
        expect(typeof enrichedEvent.data.approvedAt).toBe('string'); // timestamp ISO string
        done();
      } catch (error) {
        done(error);
      }
    });

    // Step 3: Call the approval command handler to approve the quotation
    const result = quotationApprovalCommandHandler.handle({
      type: 'ApproveQuotation',
      quotationId,
      userId,
    });

    expect(result.success).toBe(true);
    expect(result.event.type).toBe('QuotationApproved');
  });
});

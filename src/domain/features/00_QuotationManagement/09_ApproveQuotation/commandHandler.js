import { eventBus } from '@core/eventBus';
import { quotationEventStore } from '@core/eventStore';
import { QuotationAggregate } from '@entities/Quotation/aggregate';
import { type } from '@testing-library/user-event/dist/type';

export const quotationApprovalCommandHandler = {
  handle(command) {
    console.log(`[QuotationApprovalCommandHandler] Handling command: ${command.type}`, command);

    if (command.type !== 'ApproveQuotation') {
      console.warn(`[QuotationApprovalCommandHandler] Unknown command type: ${command.type}`);
      return { success: false, message: `Unknown command type: ${command.type}` };
    }

    const events = quotationEventStore.loadEvents(command.quotationId);
    const aggregate = QuotationAggregate.replay(events);
    console.log(`[QuotationApprovalCommandHandler] Replayed aggregate state:`, aggregate);

    if (!aggregate || aggregate.status === 'NOT_CREATED') {
      return {
        success: false,
        message: `Quotation ${command.quotationId} does not exist.`,
        code: 'QUOTATION_NOT_FOUND',
      };
    }

    const event = aggregate.approve(command);
    if (!event) {
      return {
        success: false,
        message: `Quotation ${command.quotationId} is already approved.`,
        code: 'QUOTATION_ALREADY_APPROVED',
        quotationId: command.quotationId,
        requestId: aggregate.requestId,
      };
    }

    // 💡 Enrich domain event before publishing
    const enrichedEvent = {
      type: 'QuotationApproved',
      quotationId: aggregate.quotationId,
          data: {
            requestId: aggregate.requestId,
            changeRequestId: aggregate.changeRequestId,
            quotationDetails: aggregate.quotationDetails,
            quotationStatus: aggregate.status,
            approvedByUserId: command.userId,
            approvedAt: new Date().toISOString(),
          },
          metadata: {
            timestamp: new Date().toISOString(),
          },
      };
    console.log('[QuotationApprovalCommandHandler] Generated QuotationApprovedEvent EnrichEvent:', enrichedEvent);

    quotationEventStore.append(event);      // Store original domain event
    eventBus.publish(enrichedEvent);        // Publish enriched event

    return { success: true, event: enrichedEvent };
  }
};

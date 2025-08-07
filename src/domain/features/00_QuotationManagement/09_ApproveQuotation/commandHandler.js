// Handles commands related to the Quotation Approval domain.

import { eventBus } from '@core/eventBus';
import { quotationEventStore } from '@core/eventStore';
import { QuotationAggregate } from '@entities/Quotation/aggregate';

/**
 * Handles approval of a quotation.
 */
export const quotationApprovalCommandHandler = {
  /**
   * Handles an ApproveQuotation command by hydrating the aggregate and applying business rules.
   * @param {object} command - The ApproveQuotationCommand object.
   * @returns {object} Result indicating success or failure.
   */
  handle(command) {
    console.log(`[QuotationApprovalCommandHandler] Handling command: ${command.type}`, command);

    if (command.type !== 'ApproveQuotation') {
      console.warn(`[QuotationApprovalCommandHandler] Unknown command type: ${command.type}`);
      return { success: false, message: `Unknown command type: ${command.type}` };
    }

    // Step 1: Load events for the aggregate
    const events = quotationEventStore.loadEvents(command.quotationId);
    console.log(`[QuotationApprovalCommandHandler] Loaded ${events.length} events for quotationId: ${command.quotationId}`);

    // Step 2: Hydrate the aggregate
    const aggregate = QuotationAggregate.replay(events); 

    // Step 3: Let the aggregate handle the command
    const event = aggregate.approve(command);
    if (!event) {
      return {
        success: false,
        message: `Quotation ${command.quotationId} is already approved.`,
        code: 'QUOTATION_ALREADY_APPROVED',
        quotationId: command.quotationId,
        requestId: command.requestId,
      };
    }

    // Step 4: Persist and publish the new event
    quotationEventStore.append(event);
    eventBus.publish(event);

    return { success: true, event };
  }
};

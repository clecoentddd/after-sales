// quotation/commandHandler.js
import { v4 as uuidv4 } from 'uuid';
import { CreateQuotationCommand } from './commands';
import { QuotationAggregate } from '@entities/Quotation/aggregate';
import { quotationEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

export const createQuotationCommandHandler = {
  /**
   * Handles CreateQuotationCommand by hydrating the aggregate and emitting events.
   * @param {object} input - Contains requestId, customerId, and requestDetails
   */
  handle(input) {
    console.log(`[CreateQuotationCommandHandler] Handling quotation for request: ${input.requestId}`);

    const quotationId = uuidv4();
    const command = CreateQuotationCommand(quotationId, input.requestId, input.customerId, input.requestDetails);

    const event = QuotationAggregate.create(command);

    quotationEventStore.append(event);
    eventBus.publish(event);

    return { success: true, event };
  }
};

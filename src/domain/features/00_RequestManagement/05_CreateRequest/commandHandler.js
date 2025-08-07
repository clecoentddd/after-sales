import { v4 as uuidv4 } from 'uuid';
import { RequestAggregate } from '@entities/Request/aggregate';
import { requestEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';
import { CreateRequestCommand } from './commands';

export const createRequestCommandHandler = {
  handle(command) {
    console.log(`[CreateRequestCommandHandler] Handling command:`, command);

    const requestId = uuidv4();

    const createCommand = CreateRequestCommand(
      requestId,
      command.customerId,
      command.requestDetails
    );

    try {
      const event = RequestAggregate.create(createCommand);
      requestEventStore.append(event);
      eventBus.publish(event);
      return { success: true, event };
    } catch (error) {
      console.warn(`[CreateRequestCommandHandler] Failed to create request: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
};

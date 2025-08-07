import { v4 as uuidv4 } from 'uuid';
import { RequestAggregate } from '@entities/Request/aggregate';
import { requestEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';
import { RaiseRequestCommand } from './commands';

export const RaiseRequestCommandHandler = {
  handle(command) {
    console.log(`[RaiseRequestCommandHandler] Handling command:`, command);

    const requestId = uuidv4();
    const changeRequestId = null; // No changeRequest for initial creation
    const versionId = 1; // Initial version

    const createCommand = RaiseRequestCommand(
      requestId,
      command.customerId,
      command.requestDetails,
      changeRequestId,
      versionId
    );

    try {
      const event = RequestAggregate.create(createCommand);
      requestEventStore.append(event);
      eventBus.publish(event);
      return { success: true, event };
    } catch (error) {
      console.warn(`[RaiseRequestCommandHandler] Failed to create request: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
};

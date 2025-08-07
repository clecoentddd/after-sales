// src/domain/features/19_ChangeRequested/commandHandler.js

import { ChangeRequestAggregate } from './aggregate';
import { RequestAggregate } from '@entities/Request/aggregate';
import { requestEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';
import { v4 as uuidv4 } from 'uuid';
import { RaiseChangeRequestCommand } from './commands';

export const changeRequestCommandHandler = {
  handle(command) {
    console.log(`[ChangeRequestCommandHandler] Handling command:`, command);

    const changeRequestId = uuidv4(); // Generate UUID for the change request

    try {
      // 1. Rehydrate the request aggregate
      const requestEvents = requestEventStore
        .getEvents()
        .filter(e => e.data.requestId === command.requestId);

      const requestAggregate = new RequestAggregate();
      requestAggregate.replay(requestEvents);
      console.log(`[ChangeRequestCommandHandler] Request aggregate state after replay:`, requestAggregate);

      // 2. Business rule: is change request allowed?
      requestAggregate.ensureChangeRequestAllowed();

      // 3. Create command with required changeRequestId
      const enrichedCommand = RaiseChangeRequestCommand(
        command.requestId,
        command.changedByUserId,
        command.description,
        changeRequestId
      );

      // 4. Create change request event
      const event = ChangeRequestAggregate.raiseChangeRequest(enrichedCommand);
      console.log(`[ChangeRequestCommandHandler] Change request event created:`, event);

      // 5. Store and publish the event
      requestEventStore.append(event);
      eventBus.publish(event);

      return { success: true, event };
    } catch (error) {
      console.warn(`[ChangeRequestCommandHandler] Command rejected: ${error.message}`);

      // 6. Create a rejection event
      const rejectionEvent = ChangeRequestAggregate.rejectChangeRequest({
        ...command,
        changeRequestId,
        reason: error.message,
      });

      console.log(`[ChangeRequestCommandHandler] Change request rejection event created:`, rejectionEvent);

      // 7. Store and publish the rejection
      requestEventStore.append(rejectionEvent);
      eventBus.publish(rejectionEvent);

      return { success: false, error: error.message };
    }
  }
};

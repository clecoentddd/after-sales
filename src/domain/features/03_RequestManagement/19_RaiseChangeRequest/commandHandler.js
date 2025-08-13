// src/domain/features/19_ChangeRequested/commandHandler.js

import { RequestAggregate } from '@entities/Request/aggregate';
import { requestEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';
import { v4 as uuidv4 } from 'uuid';
import { RaiseChangeRequestCommand } from './commands';

export const changeRequestCommandHandler = {
  handle(command) {
    console.log(`[ChangeRequestCommandHandler] Handling command:`, command);
    const changeRequestId = uuidv4();
    const requestEvents = requestEventStore.getEvents();
    const filteredEvents = requestEvents.filter(e => e.aggregateId === command.requestId);

    // Déclare requestAggregate ici, avant le try/catch
    const requestAggregate = new RequestAggregate();
    requestAggregate.replay(filteredEvents);

    try {
      requestAggregate.ensureChangeRequestAllowed();
      const enrichedCommand = {
        ...command,
        changeRequestId
      };
      const event = requestAggregate.raiseChangeRequest(enrichedCommand);
      console.log(`[ChangeRequestCommandHandler] Change request event created:`, event);
      requestEventStore.append(event);
      eventBus.publish(event);
      return { success: true, event };
    } catch (error) {
      console.warn(`[ChangeRequestCommandHandler] Command rejected: ${error.message}`);
      const rejectionEvent = requestAggregate.rejectChangeRequest({
        ...command,
        changeRequestId,
        reason: error.message,
      });
      console.log(`[ChangeRequestCommandHandler] Change request rejection event created:`, rejectionEvent);
      requestEventStore.append(rejectionEvent);
      eventBus.publish(rejectionEvent);
      return { success: false, error: error.message, event: rejectionEvent };
    }
  }
};

// src/domain/features/19_ChangeRequested/commandHandler.js

import { ChangeRequestAggregate } from './aggregate';
import { RequestAggregate } from '../../entities/Request/aggregate';
import { requestEventStore } from '../../core/eventStore';
import { eventBus } from '../../core/eventBus';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

export const changeRequestCommandHandler = {
  handle(command) {
    console.log(`[ChangeRequestCommandHandler] Handling command:`, command);

    try {
      // 1. Rehydrate the request aggregate
      const requestEvents = requestEventStore
        .getEvents()
        .filter(e => e.data.requestId === command.requestId);

      const requestAggregate = new RequestAggregate();
      requestAggregate.replay(requestEvents);

      // 2. Business rule: is change request allowed?
      requestAggregate.ensureChangeRequestAllowed();

      const changeRequestId = uuidv4(); // Generate UUID for the change request

      const commandWithId = {
        ...command,
        changeRequestId, // Inject generated ID
      };

      // 3. Create change request
      const event = ChangeRequestAggregate.raiseChangeRequest(commandWithId);


      requestEventStore.append(event);
      eventBus.publish(event);

      return { success: true, event };
    } catch (error) {
      console.warn(`[ChangeRequestCommandHandler] Command rejected: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
};

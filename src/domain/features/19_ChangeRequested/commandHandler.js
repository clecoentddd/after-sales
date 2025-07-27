// src/domain/features/19_ChangeRequested/commandHandler.js

import { ChangeRequestAggregate } from './aggregate';
import { RequestAggregate } from '../../entities/Request/aggregate';
import { changeRequestEventStore } from '../../core/eventStore';
import { requestEventStore } from '../../core/eventStore';
import { eventBus } from '../../core/eventBus';

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

      // 3. Create change request
      const changeRequestAggregate = new ChangeRequestAggregate();
      const event = changeRequestAggregate.raiseChangeRequest(command);

      requestEventStore.append(event);
      eventBus.publish(event);

      return { success: true, event };
    } catch (error) {
      console.warn(`[ChangeRequestCommandHandler] Command rejected: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
};

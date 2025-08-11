import { RequestAggregate } from '@entities/Request/aggregate';
import { requestEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

export const closeRequestCommandHandler = {
  handle(command) {

console.log(`[CloseRequestCommandHandler] Handling command: ${command.type}`, command);  
  // Retrieve all events from the requestEventStore
  const allEvents = requestEventStore.getEvents();

  // Log all events before filtering
  console.log('[CloseRequestCommandHandler] All events in requestEventStore before filtering:', allEvents);

  // Filter events based on requestId and changeRequestId
  const events = allEvents.filter(e =>
    e.aggregateId === command.requestId &&
    e.data.changeRequestId === command.changeRequestId
  );

  // Log the command details for context
  console.log(`[CloseRequestCommandHandler] Filtering events for requestId: ${command.requestId} and changeRequestId: ${command.changeRequestId}`);

  // Log the events found after filtering
  console.log(`[CloseRequestCommandHandler] Events found in requestEventStore after filtering:`, events);
    console.log(`[CloseRequestCommandHandler] Handling command: ${command.type}`, command);  
    const aggregate = new RequestAggregate();
    aggregate.replay(events);

    const event = aggregate.close(command);

    requestEventStore.append(event);
    eventBus.publish(event);

    return { success: true, event };
  }
};

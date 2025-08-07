import { RequestAggregate } from '@entities/Request/aggregate';
import { requestEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

export const closeRequestCommandHandler = {
  handle(command) {
    const events = requestEventStore
      .getEvents()
      .filter(e => e.data.requestId === command.requestId);

    const aggregate = new RequestAggregate();
    aggregate.replay(events);

    const event = aggregate.close(command);

    requestEventStore.append(event);
    eventBus.publish(event);

    return { success: true, event };
  }
};

import { v4 as uuidv4 } from 'uuid';

class EventStore {
  constructor() {
    this.events = [];
  }

append(event) {
    // Ensure the event has an ID and timestamp
    const now = new Date();
    const eventWithId = {
      ...event,
      eventId: event.eventId || uuidv4(),
      timestamp: event.timestamp || now.toISOString(),
      metadata: {
        ...event.metadata,
        timestamp: event.metadata?.timestamp || now.toISOString()
      }
    };

    // If the last event has the same timestamp, add 1ms
    if (this.events.length > 0) {
      const lastEvent = this.events[this.events.length - 1];
      const lastTimestamp = new Date(lastEvent.metadata?.timestamp || lastEvent.timestamp).getTime();
      const currentTimestamp = new Date(eventWithId.metadata?.timestamp || eventWithId.timestamp).getTime();

      if (lastTimestamp >= currentTimestamp) {
        // Add 1ms to ensure unique timestamp
        const newDate = new Date(currentTimestamp + 1);
        eventWithId.timestamp = newDate.toISOString();
        eventWithId.metadata = {
          ...eventWithId.metadata,
          timestamp: newDate.toISOString()
        };
      }
    }

    this.events.push(eventWithId);
    return eventWithId;
}

  getEvents() {
    return this.events
    .slice() // make a copy so you don’t mutate the original
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  getEventsByAggregateId(aggregateId) {
    return this.events
      .filter(e => e.aggregateId === aggregateId)
      .sort(
        (a, b) =>
          new Date(a.metadata?.timestamp || a.timestamp) -
          new Date(b.metadata?.timestamp || b.timestamp)
      );
  }

    // New method: loadEvents
  loadEvents(aggregateId) {
    // Filter the internal events array to return only events belonging to the specified aggregateId
    return this.events.filter(event => event.aggregateId === aggregateId);
  }

    clear() {
    this.events = [];
  }
}

export const organizationEventStore = new EventStore();
export const customerEventStore = new EventStore();
export const requestEventStore = new EventStore();
export const quotationEventStore = new EventStore(); 
export const jobEventStore = new EventStore(); 
export const invoiceEventStore = new EventStore(); 
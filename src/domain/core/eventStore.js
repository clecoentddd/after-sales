import { v4 as uuidv4 } from 'uuid';

class EventStore {
  constructor() {
    this.events = [];
  }

  append(event) {
    const eventWithId = {
      ...event,
      eventId: event.eventId || uuidv4(),
      timestamp: event.timestamp || new Date().toISOString()
    };
    this.events.push(eventWithId);
    return eventWithId;
  }

  getEvents() {
    return [...this.events];
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
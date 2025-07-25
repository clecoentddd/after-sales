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
}

export const organizationEventStore = new EventStore();
export const customerEventStore = new EventStore();
export const requestEventStore = new EventStore();
export const quotationEventStore = new EventStore(); 
export const jobEventStore = new EventStore(); 
export const invoiceEventStore = new EventStore(); 
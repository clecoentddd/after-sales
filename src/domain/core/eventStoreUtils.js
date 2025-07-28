import {
  organizationEventStore,
  customerEventStore,
  requestEventStore,
  quotationEventStore,
  jobEventStore,
  invoiceEventStore,
} from './eventStore';

export function getEventsFromStores(stores) {
  let allEvents = [];
  stores.forEach(store => {
    allEvents = allEvents.concat(store.getEvents());
  });

  // Check for missing or invalid metadata.timestamp and log them
  allEvents.forEach((event, index) => {
    if (!event.metadata || !event.metadata.timestamp) {
      console.warn(`[getEventsFromStores] Event at index ${index} is missing metadata.timestamp:`, event);
    }
  });
  
  // Optionally, sort events by timestamp if order matters
  allEvents.sort((a, b) => new Date(a.metadata.timestamp) - new Date(b.metadata.timestamp));
  return allEvents;
}

export function getAllEvents() {
  const stores = [
    { name: 'organizationEventStore', store: organizationEventStore },
    { name: 'customerEventStore', store: customerEventStore },
    { name: 'requestEventStore', store: requestEventStore },
    { name: 'quotationEventStore', store: quotationEventStore },
    { name: 'jobEventStore', store: jobEventStore },
    { name: 'invoiceEventStore', store: invoiceEventStore },
  ];

  const allEvents = stores.flatMap(({ name, store }) =>
    store.getEvents().map(event => ({ ...event, source: name }))
  );

  // Optional: sort chronologically (most recent first)
  return allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

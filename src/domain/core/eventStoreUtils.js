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

  // Log the total number of events collected
  console.log(`[getEventsFromStores] Total events collected: ${allEvents.length}`);

  // Check for missing or invalid fields and log them
  allEvents.forEach((event, index) => {
    if (!event.type) {
      console.warn(`[getEventsFromStores] Event at index ${index} is missing type:`, event);
    }

    if (!event.metadata) {
      console.warn(`[getEventsFromStores] Event at index ${index} is missing metadata:`, event);
    } else if (!event.metadata.timestamp) {
      console.warn(`[getEventsFromStores] Event at index ${index} is missing metadata.timestamp:`, event);
    } else {
      // Check if the timestamp is a valid date
      const timestampDate = new Date(event.metadata.timestamp);
      if (isNaN(timestampDate.getTime())) {
        console.warn(`[getEventsFromStores] Event at index ${index} has an invalid metadata.timestamp:`, event);
      }
    }

    // Check if the event data is present and valid
    if (!event.data) {
      console.warn(`[getEventsFromStores] Event at index ${index} is missing data:`, event);
    }
  });

  // Optionally, sort events by timestamp if order matters
  allEvents.sort((a, b) => {
    const dateA = new Date(a.metadata.timestamp);
    const dateB = new Date(b.metadata.timestamp);
    return dateA - dateB;
  });

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

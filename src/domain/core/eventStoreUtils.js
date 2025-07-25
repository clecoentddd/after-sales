import {
  organizationEventStore,
  customerEventStore,
  requestEventStore,
  quotationEventStore,
  quoteApprovalEventStore,
  jobCreationEventStore,
  startJobEventStore,
  jobCompletionEventStore,
  invoiceEventStore,
  changeRequestEventStore,
  onHoldJobEventStore,
  onHoldQuotationEventStore,
} from './eventStore';

export function getAllEvents() {
  const stores = [
    { name: 'organizationEventStore', store: organizationEventStore },
    { name: 'customerEventStore', store: customerEventStore },
    { name: 'requestEventStore', store: requestEventStore },
    { name: 'quotationEventStore', store: quotationEventStore },
    { name: 'quoteApprovalEventStore', store: quoteApprovalEventStore },
    { name: 'jobCreationEventStore', store: jobCreationEventStore },
    { name: 'startJobEventStore', store: startJobEventStore },
    { name: 'jobCompletionEventStore', store: jobCompletionEventStore },
    { name: 'invoiceEventStore', store: invoiceEventStore },
    { name: 'changeRequestEventStore', store: changeRequestEventStore },
    { name: 'onHoldJobEventStore', store: onHoldJobEventStore },
    { name: 'onHoldQuotationEventStore', store: onHoldQuotationEventStore },
  ];

  const allEvents = stores.flatMap(({ name, store }) =>
    store.getEvents().map(event => ({ ...event, source: name }))
  );

  // Optional: sort chronologically (most recent first)
  return allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

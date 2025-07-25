import { useEffect, useState } from 'react';
import {
  quotationEventStore,
  quoteApprovalEventStore,
  onHoldQuotationEventStore
} from '../../core/eventStore';
import { eventBus } from '../../core/eventBus';

export function useQuotationSlice() {
  const [quotations, setQuotations] = useState([]);
  const [quotationEvents, setQuotationEvents] = useState([]);
  const [approvedQuotes, setApprovedQuotes] = useState([]);

  useEffect(() => {
    const quotationCreatedEvents = quotationEventStore.getEvents().filter(e => e.type === 'QuotationCreated');
    const quoteApprovedEvents = quoteApprovalEventStore.getEvents().filter(e => e.type === 'QuoteApproved');
    const quotationOnHoldEvents = onHoldQuotationEventStore.getEvents().filter(e => e.type === 'QuotationOnHold');

    const allEvents = [
      ...quotationCreatedEvents,
      ...quoteApprovedEvents,
      ...quotationOnHoldEvents
    ].sort((a, b) => new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime());

    setQuotationEvents(allEvents);
    setApprovedQuotes(quoteApprovedEvents.map(e => e.data));

    const map = new Map();

    allEvents.forEach(event => {
      const quotationId = event.data.quotationId || event.data.quoteId;
      let current = map.get(quotationId) || { quotationId };

      if (event.type === 'QuotationCreated') {
        const existingStatus = current.status;
        current = { ...current, ...event.data, status: event.data.status || 'Draft' };
        if (existingStatus && existingStatus !== 'Draft' && existingStatus !== 'Pending') {
          current.status = existingStatus;
        }
      } else if (event.type === 'QuoteApproved') {
        current.status = 'Approved';
      } else if (event.type === 'QuotationOnHold') {
        current.status = 'On Hold';
        current.onHoldReason = event.data.reason;
        current.requestId = event.data.requestId;
        current.changeRequestId = event.data.changeRequestId;
      }

      map.set(quotationId, current);
    });

    setQuotations(Array.from(map.values()));
  }, []);

  useEffect(() => {
    const unsubCreated = eventBus.subscribe('QuotationCreated', (event) => {
      setQuotationEvents(prev => [...prev, event]);
      setQuotations(prev => {
        const next = [...prev];
        const idx = next.findIndex(q => q.quotationId === event.data.quotationId);

        const newData = {
          quotationId: event.data.quotationId,
          requestId: event.data.requestId,
          customerId: event.data.customerId,
          quotationDetails: event.data.quotationDetails,
          status: event.data.status || 'Draft'
        };

        if (idx > -1) {
          const existing = next[idx];
          next[idx] = {
            ...existing,
            ...newData,
            status: (existing.status && existing.status !== 'Draft' && existing.status !== 'Pending')
              ? existing.status
              : newData.status
          };
        } else {
          next.push(newData);
        }
        return next;
      });
    });

    const unsubApproved = eventBus.subscribe('QuoteApproved', (event) => {
      setApprovedQuotes(prev => [...prev, event.data]);
      setQuotationEvents(prev => [...prev, event]);
      setQuotations(prev => prev.map(q =>
        q.quotationId === event.data.quoteId
          ? { ...q, status: 'Approved' }
          : q
      ));
    });

    const unsubOnHold = eventBus.subscribe('QuotationOnHold', (event) => {
      setQuotationEvents(prev => [...prev, event]);
      setQuotations(prev => {
        const next = [...prev];
        const idx = next.findIndex(q => q.quotationId === event.data.quotationId);

        const holdData = {
          quotationId: event.data.quotationId,
          status: 'On Hold',
          onHoldReason: event.data.reason,
          requestId: event.data.requestId || null,
          changeRequestId: event.data.changeRequestId || null
        };

        if (idx > -1) {
          next[idx] = { ...next[idx], ...holdData };
        } else {
          next.push({
            customerId: null,
            quotationDetails: {},
            ...holdData
          });
        }

        return next;
      });
    });

    return () => {
      unsubCreated();
      unsubApproved();
      unsubOnHold();
    };
  }, []);

  return { quotations, quotationEvents, approvedQuotes };
}

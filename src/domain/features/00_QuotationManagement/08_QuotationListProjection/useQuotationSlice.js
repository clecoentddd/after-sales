import { useEffect, useState } from 'react';
const { quotationEventStore } = require('../../../core/eventStore');
const { eventBus } = require('../../../core/eventBus');

export function useQuotationSlice() {
  const [quotations, setQuotations] = useState([]);
  const [quotationEvents, setQuotationEvents] = useState([]);
  const [approvedQuotations, setApprovedQuotations] = useState([]);

  useEffect(() => {
    console.log('[useQuotationSlice] Initial useEffect run: Loading all events from store.');
    const quotationCreatedEvents = quotationEventStore.getEvents().filter(e => e.type === 'QuotationCreated');
    const quotationApprovedEvents = quotationEventStore.getEvents().filter(e => e.type === 'QuotationApproved');
    const quotationOnHoldEvents = quotationEventStore.getEvents().filter(e => e.type === 'QuotationOnHold');

    const allEvents = [
      ...quotationCreatedEvents,
      ...quotationApprovedEvents,
      ...quotationOnHoldEvents
    ].sort((a, b) => new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime());

    console.log('[useQuotationSlice] All sorted events from store:', allEvents);

    setQuotationEvents(allEvents);
    setApprovedQuotations(quotationApprovedEvents.map(e => e.data));

    const map = new Map();

    allEvents.forEach(event => {
      console.log('[useQuotationSlice] Processing event for map:', event);
      const quotationId = event.data.quotationId || event.data.quotationId; // This is redundant, but kept as-is from your code
      let current = map.get(quotationId) || { quotationId };

      if (event.type === 'QuotationCreated') {
        const existingStatus = current.status;
        current = { ...current, ...event.data, status: event.data.status || 'Draft' };
        if (existingStatus && existingStatus !== 'Draft' && existingStatus !== 'Pending') {
          current.status = existingStatus;
        }
        console.log(`[useQuotationSlice] Map update (Created): ${quotationId}`, current);
      } else if (event.type === 'QuotationApproved') {
        current.status = 'Approved';
        console.log(`[useQuotationSlice] Map update (Approved): ${quotationId}`, current);
      } else if (event.type === 'QuotationOnHold') {
        current.status = 'OnHold';
        current.onHoldReason = event.data.reason;
        current.requestId = event.data.requestId;
        current.changeRequestId = event.data.changeRequestId;
        console.log(`[useQuotationSlice] Map update (OnHold): ${quotationId}`, current);
      }

      map.set(quotationId, current);
    });

    console.log('[useQuotationSlice] Final map content:', map);
    setQuotations(Array.from(map.values()));
    console.log('[useQuotationSlice] Quotations state set to:', Array.from(map.values()));
  }, []);

  useEffect(() => {
    console.log('[useQuotationSlice] Subscribing to live events.');

    const unsubCreated = eventBus.subscribe('QuotationCreated', (event) => {
      console.log('[useQuotationSlice] Live: Received QuotationCreated event:', event);
      setQuotationEvents(prev => [...prev, event]);
      setQuotations(prev => {
        console.log('[useQuotationSlice] Live (Created): Previous quotations state:', prev);
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
          console.log(`[useQuotationSlice] Live (Created): Updated existing quotation ${event.data.quotationId}:`, next[idx]);
        } else {
          next.push(newData);
          console.log(`[useQuotationSlice] Live (Created): Added new quotation ${event.data.quotationId}:`, newData);
        }
        console.log('[useQuotationSlice] Live (Created): Next quotations state:', next);
        return next;
      });
    });

    const unsubApproved = eventBus.subscribe('QuotationApproved', (event) => {
      console.log('[useQuotationSlice] Live: Received QuotationApproved event:', event);
      setApprovedQuotations(prev => [...prev, event.data]);
      setQuotationEvents(prev => [...prev, event]);
      setQuotations(prev => {
        console.log('[useQuotationSlice] Live (Approved): Previous quotations state:', prev);
        const next = prev.map(q =>
          q.quotationId === event.data.quotationId
            ? { ...q, status: 'Approved' }
            : q
        );
        console.log(`[useQuotationSlice] Live (Approved): Updated quotation ${event.data.quotationId} to Approved.`);
        console.log('[useQuotationSlice] Live (Approved): Next quotations state:', next);
        return next;
      });
    });

    const unsubOnHold = eventBus.subscribe('QuotationOnHold', (event) => {
      console.log('[useQuotationSlice] Live: Received QuotationOnHold event:', event);
      setQuotationEvents(prev => [...prev, event]);
      setQuotations(prev => {
        console.log('[useQuotationSlice] Live (OnHold): Previous quotations state:', prev);
        const next = [...prev];
        const idx = next.findIndex(q => q.quotationId === event.data.quotationId);

        const holdData = {
          quotationId: event.data.quotationId,
          status: 'OnHold',
          onHoldReason: event.data.reason,
          requestId: event.data.requestId || null,
          changeRequestId: event.data.changeRequestId || null
        };

        if (idx > -1) {
          next[idx] = { ...next[idx], ...holdData };
          console.log(`[useQuotationSlice] Live (OnHold): Updated existing quotation ${event.data.quotationId} to OnHold:`, next[idx]);
        } else {
          next.push({
            customerId: null,
            quotationDetails: {},
            ...holdData
          });
          console.log(`[useQuotationSlice] Live (OnHold): Added new (incomplete) quotation ${event.data.quotationId} as OnHold:`, next[next.length - 1]);
        }
        console.log('[useQuotationSlice] Live (OnHold): Next quotations state:', next);
        return next;
      });
    });

    return () => {
      console.log('[useQuotationSlice] Cleaning up event subscriptions.');
      unsubCreated();
      unsubApproved();
      unsubOnHold();
    };
  }, []);

  return { quotations, quotationEvents, approvedQuotations };
}
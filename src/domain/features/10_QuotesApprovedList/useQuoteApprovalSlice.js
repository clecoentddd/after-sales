import { useEffect, useState } from 'react';
import { quotationEventStore } from '../../core/eventStore';
import { eventBus } from '../../core/eventBus';

export function useQuoteApprovalSlice() {
  const [approvedQuotes, setApprovedQuotes] = useState([]);
  const [approvalEvents, setApprovalEvents] = useState([]);

  // Load initial approved quotes from event store
  useEffect(() => {
    const approvalEventsLoaded = quotationEventStore.getEvents();
    setApprovedQuotes(
      approvalEventsLoaded.filter(e => e.type === 'QuoteApproved').map(e => e.data)
    );
    setApprovalEvents(approvalEventsLoaded);
  }, []);

  // Subscribe to new QuoteApproved events on event bus
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('QuoteApproved', (event) => {
      setApprovedQuotes(prev => [...prev, event.data]);
      setApprovalEvents(prev => [...prev, event]);
    });

    return () => unsubscribe();
  }, []);

  return { approvedQuotes, approvalEvents };
}

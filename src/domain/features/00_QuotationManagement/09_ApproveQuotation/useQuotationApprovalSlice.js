import { useEffect, useState } from 'react';
import { quotationEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

export function useQuotationApprovalSlice() {
  const [approvedQuotations, setApprovedQuotations] = useState([]);
  const [approvalEvents, setApprovalEvents] = useState([]);

  // Load initial approved quotations from event store
  useEffect(() => {
    const approvalEventsLoaded = quotationEventStore.getEvents();
    setApprovedQuotations(
      approvalEventsLoaded.filter(e => e.type === 'QuotationApproved').map(e => e.data)
    );
    setApprovalEvents(approvalEventsLoaded);
  }, []);

  // Subscribe to new QuotationApproved events on event bus
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('QuotationApproved', (event) => {
      setApprovedQuotations(prev => [...prev, event.data]);
      setApprovalEvents(prev => [...prev, event]);
    });

    return () => unsubscribe();
  }, []);

  return { approvedQuotations, approvalEvents };
}

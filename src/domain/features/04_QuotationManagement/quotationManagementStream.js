// domain/features/00_QuotationManagement/quotationManagementStream.js
import { useState, useEffect } from 'react';
import { eventBus } from '@core/eventBus';
import { quotationEventStore } from '@core/eventStore';

export function useQuotationEvents() {
  const [quotationEvents, setQuotationEvents] = useState(
    quotationEventStore.getEvents().filter(e =>
      ['QuotationCreated', 'QuotationApproved', 'QuotationOnHold'].includes(e.type)
    )
  );

  useEffect(() => {
    const unsubscribes = [
      eventBus.subscribe('QuotationCreated', (event) => {
        setQuotationEvents(prev => [...prev, event]);
      }),
      eventBus.subscribe('QuotationApproved', (event) => {
        setQuotationEvents(prev => [...prev, event]);
      }),
      eventBus.subscribe('QuotationOnHold', (event) => {
        setQuotationEvents(prev => [...prev, event]);
      })
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  return { quotationEvents };
}

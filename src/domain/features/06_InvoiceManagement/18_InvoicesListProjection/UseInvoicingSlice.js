import { useEffect, useState } from 'react';
import { invoiceEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

export function useInvoicingSlice() {
  const [invoices, setInvoices] = useState([]);
  const [invoiceEvents, setInvoiceEvents] = useState([]);

  // Load initial invoices from event store
  useEffect(() => {
    const events = invoiceEventStore.getEvents();
    setInvoices(events.filter(e => e.type === 'InvoiceRaised').map(e => e.data));
    setInvoiceEvents(events);
  }, []);

  // Subscribe to InvoiceCreated events for real-time updates
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('InvoiceRaised', (event) => {
      console.log('useInvoiceSlice... subscribing');
      setInvoices(prev => [...prev, event.data]);
      setInvoiceEvents(prev => [...prev, event]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    invoices,
    invoiceEvents,
  };
}

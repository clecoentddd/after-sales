import { useEffect, useState } from 'react';
import { invoiceEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

export function useInvoicingSlice() {
  const [invoices, setInvoices] = useState([]);
  const [invoiceEvents, setInvoiceEvents] = useState([]);

  // Load initial invoices from event store
  useEffect(() => {
    console.log('[useInvoicingSlice] Loading initial invoices and events...');
    try {
      const events = invoiceEventStore.getEvents();
      console.log('[useInvoicingSlice] Initial events loaded:', events);

      const initialInvoices = events.filter(e => e.type === 'InvoiceRaised').map(e => e.data);
      console.log('[useInvoicingSlice] Initial invoices:', initialInvoices);

      setInvoices(initialInvoices);
      setInvoiceEvents(events);
    } catch (error) {
      console.error('[useInvoicingSlice] Failed to load initial invoices:', error);
    }
  }, []);

  // Subscribe to InvoiceCreated events for real-time updates
  useEffect(() => {
    console.log('[useInvoicingSlice] Setting up event subscriptions...');

    const handleInvoiceRaised = (event) => {
      console.log('[useInvoicingSlice] InvoiceRaised event received:', event);
      setInvoices(prev => {
        const updatedInvoices = [...prev, event.data];
        console.log('[useInvoicingSlice] Updated invoices:', updatedInvoices);
        return updatedInvoices;
      });
      setInvoiceEvents(prev => {
        const updatedEvents = [...prev, event];
        console.log('[useInvoicingSlice] Updated invoice events:', updatedEvents);
        return updatedEvents;
      });
    };

    const handleInvoiceFailed = (event) => {
      console.log('[useInvoicingSlice] invoiceToRaiseToDoItemFailed event received:', event);
      setInvoiceEvents(prev => {
        const updatedEvents = [...prev, event];
        console.log('[useInvoicingSlice] Updated invoice events:', updatedEvents);
        return updatedEvents;
      });
    };

    const unsubscribe1 = eventBus.subscribe('InvoiceRaised', handleInvoiceRaised);
    const unsubscribe2 = eventBus.subscribe('invoiceToRaiseToDoItemFailed', handleInvoiceFailed);
    const unsubscribe3 = eventBus.subscribe('invoiceToRaiseToDoItemAdded', handleInvoiceFailed);

    return () => {
      console.log('[useInvoicingSlice] Cleaning up event subscriptions...');
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, []);

  return {
    invoices,
    invoiceEvents,
  };
}

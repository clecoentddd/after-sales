// domain/features/02_QuotationManagement/04_QuotationListProjection/useQuotationProjection.js

import { useState, useEffect } from 'react';
import { eventBus } from '@core/eventBus';
import {globalQuotationInit} from './globalQuotationInit';
import { queryQuotationsProjection } from './quotationProjectionDB';

export function useQuotationProjection() {
  // ✅ Initialize projection handler once
  globalQuotationInit();

  // Projection state
  const [quotations, setQuotations] = useState(queryQuotationsProjection());

  useEffect(() => {
  const updateProjection = () => {
    console.log('[useQuotationProjection] Updating projection due to event');
    setQuotations(queryQuotationsProjection());
  };

  const unsubscribers = [
    eventBus.subscribe('QuotationCreated', updateProjection),
    eventBus.subscribe('QuotationApproved', updateProjection),
    eventBus.subscribe('QuotationOnHold', updateProjection),
    // add more if needed (QuotationRejected, etc.)
  ];

  return () => unsubscribers.forEach(unsub => unsub());
}, []);

  return { quotations };
}

// src/subscribers/QuotationSubscriberToChangeRequest.js

import { useEffect } from 'react';
import { eventBus } from '../domain/core/eventBus';
import { quotationEventStore } from '../domain/core/eventStore';
import { onHoldQuotationCommandHandler } from '../domain/features/04_QuotationManagement/21_PutQuotationOnHold/commandHandler';

/**
 * This subscriber listens for ChangeRequestRaised events.
 * When triggered, it looks up quotations related to the requestId and passes
 * the necessary context to the command handler for business logic processing.
 */
function QuotationSubscriberToChangeRequest({ currentUserId }) {
  useEffect(() => {
    console.log('[QuotationSubscriberToChangeRequest] Subscribing to ChangeRequestRaised events');

    const unsubscribe = eventBus.subscribe('ChangeRequestRaised_old', (event) => {
      const { requestId, changeRequestId, changedByUserId, description } = event.data;

      console.log('[QuotationSubscriberToChangeRequest] Event received:', event);

      // Find all quotations that match the requestId
      const matchingQuotations = quotationEventStore
        .getEvents()
        .filter(e => e.type === 'QuotationCreated' && e.data.requestId === requestId)
        .map(e => e.data);

      if (matchingQuotations.length === 0) {
        console.error(`[QuotationSubscriberToChangeRequest] ❌ No quotation found for requestId: ${requestId}`);
        return;
      }

      if (matchingQuotations.length > 1) {
        console.warn(`[QuotationSubscriberToChangeRequest] ⚠️ Multiple quotations found for requestId: ${requestId}. Skipping processing.`);
        return;
      }

      const quotation = matchingQuotations[0];
      const quotationId = quotation.quotationId;

      console.log(`[QuotationSubscriberToChangeRequest] ✅ Found quotation ${quotationId} for requestId: ${requestId}`);

      // Call the command handler — it will decide what to do
      const result = onHoldQuotationCommandHandler.handle({
        type: 'PutQuotationOnHold',
        quotationId,
        requestId,
        changeRequestId,
        heldByUserId: currentUserId,
        reason: `Automatic hold triggered by change request: ${description}`
      });

      if (!result.success) {
        console.error(`[QuotationSubscriberToChangeRequest] ❌ Command failed for quotationId ${quotationId}:`, result.message);
      }
    });

    return () => {
      console.log('[QuotationSubscriberToChangeRequest] Unsubscribing from ChangeRequestRaised events');
      unsubscribe();
    };
  }, [currentUserId]);

  return null;
}

export default QuotationSubscriberToChangeRequest;

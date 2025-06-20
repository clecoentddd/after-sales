import { useEffect } from 'react';
import { eventBus } from '../domain/core/eventBus';
// Import the command handler and command for putting quotations on hold
import { onHoldQuotationCommandHandler } from '../domain/features/onHoldQuotation/commandHandler';
import { PutQuotationOnHoldCommand } from '../domain/features/onHoldQuotation/commands';
// NEW: Import necessary event stores to reconstruct quotation state
import { quotationEventStore, quoteApprovalEventStore, onHoldQuotationEventStore } from '../domain/core/eventStore';

/**
 * Reconstructs the current state of a single quotation from its events.
 * This function reads directly from the event stores, ensuring the latest state
 * is considered at the time of event processing.
 * @param {string} quotationId - The ID of the quotation to reconstruct.
 * @returns {object|null} The reconstructed quotation object or null if not found.
 */
const reconstructQuotationState = (quotationId) => {
  // Combine all relevant event types for the quotation and sort them chronologically
  const allQuotationEvents = [
    ...quotationEventStore.getEvents(), 
    ...quoteApprovalEventStore.getEvents(), 
    ...onHoldQuotationEventStore.getEvents() 
  ].filter(event => (event.data.quotationId === quotationId || event.data.quoteId === quotationId))
   .sort((a, b) => new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime());

  let quotation = null;

  allQuotationEvents.forEach(event => {
    // Initialize or update quotation state based on event type
    if (event.type === 'QuotationCreated') {
      // If a basic quotation object doesn't exist yet, create one
      if (!quotation) {
        quotation = { ...event.data };
      } else {
        // If it exists (e.g., from an earlier 'On Hold' placeholder), merge in creation data
        // but preserve a status if it's already 'On Hold' or 'Approved'
        const existingStatus = quotation.status;
        quotation = { ...quotation, ...event.data };
        if (existingStatus && existingStatus !== 'Draft' && existingStatus !== 'Pending') {
          quotation.status = existingStatus; // Keep the more advanced status
        }
      }
    } else if (quotation && event.type === 'QuoteApproved') {
      quotation.status = 'Approved';
    } else if (quotation && event.type === 'QuotationOnHold') {
      quotation.status = 'On Hold';
      quotation.onHoldReason = event.data.reason;
      quotation.requestId = event.data.requestId || quotation.requestId; // Ensure requestId is captured
      quotation.changeRequestId = event.data.changeRequestId || quotation.changeRequestId; // Ensure changeRequestId is captured
    }
  });
  return quotation;
};


/**
 * QuotationSubscriberToChangeRequest component.
 * This component acts as a non-visual subscriber to ChangeRequestRaised events.
 * Its purpose is to monitor for change requests and, if applicable,
 * trigger a command to put related quotations on hold.
 * It renders nothing visible to the user.
 *
 * @param {string} currentUserId - The ID of the current user (or system user in this context).
 */
function QuotationSubscriberToChangeRequest({ currentUserId }) { // REMOVED 'quotations' prop
  useEffect(() => {
    console.log('[QuotationSubscriberToChangeRequest] Subscribing to ChangeRequestRaised events.');
    console.log('[QuotationSubscriberToChangeRequest] Current userId passed:', currentUserId);

    const unsubscribe = eventBus.subscribe('ChangeRequestRaised', (event) => {
      console.log('--- Event received by QuotationSubscriberToChangeRequest ---');
      console.log('Event received is:', event);
      
      const { requestId, description, changedByUserId } = event.data;
      console.log(`[QuotationSubscriberToChangeRequest] Processing ChangeRequestRaised for requestId: ${requestId}`);

      // NEW: Find all QuotationCreated events related to this requestId
      const quotationCreatedEventsForRequest = quotationEventStore.getEvents()
        .filter(e => e.type === 'QuotationCreated' && e.data.requestId === requestId)
        .map(e => e.data);

      console.log(`[QuotationSubscriberToChangeRequest] Found ${quotationCreatedEventsForRequest.length} QuotationCreated events for requestId ${requestId}:`, quotationCreatedEventsForRequest);


      if (quotationCreatedEventsForRequest.length > 0) {
        quotationCreatedEventsForRequest.forEach(quotationData => {
          // NEW: Reconstruct the latest state of *each* specific quotation
          const currentQuotationState = reconstructQuotationState(quotationData.quotationId);
          console.log(`[QuotationSubscriberToChangeRequest] Reconstructed state for quotation ${quotationData.quotationId}:`, currentQuotationState);

          if (currentQuotationState) {
            // Business rule: Only put quotations on hold if they are 'Draft' or 'Pending'
            if (currentQuotationState.status === 'Draft' || currentQuotationState.status === 'Pending') {
              console.log(`[QuotationSubscriberToChangeRequest] Quotation ${currentQuotationState.quotationId} is in status '${currentQuotationState.status}'. Attempting to dispatch PutQuotationOnHoldCommand.`);
              
              // Call the command handler directly
              const commandResult = onHoldQuotationCommandHandler.handle(
                PutQuotationOnHoldCommand(
                  currentQuotationState.quotationId,
                  currentUserId, // The user who raised the change request is performing the hold
                  `Automatic hold due to change request for associated request: ${description}`
                )
              );
              console.log(`[QuotationSubscriberToChangeRequest] Command dispatch result for PutQuotationOnHoldCommand on ${currentQuotationState.quotationId}:`, commandResult);
              if (!commandResult.success) {
                  console.error(`[QuotationSubscriberToChangeRequest] Failed to dispatch PutQuotationOnHoldCommand for ${currentQuotationState.quotationId}:`, commandResult.message);
              }
            } else {
              console.log(`[QuotationSubscriberToChangeRequest] Quotation ${currentQuotationState.quotationId} is not in 'Draft' or 'Pending' status (Current: ${currentQuotationState.status}). Skipping hold for this quotation.`);
            }
          } else {
            console.warn(`[QuotationSubscriberToChangeRequest] Could not reconstruct state for quotation ${quotationData.quotationId}. Skipping hold.`);
          }
        });
      } else {
        console.log(`[QuotationSubscriberToChangeRequest] No QuotationCreated events found for request ID: ${requestId}. No hold command dispatched.`);
      }

      console.log('------------------------------------------------------------');
    });

    // Cleanup function to unsubscribe when the component unmounts
    return () => {
      console.log('[QuotationSubscriberToChangeRequest] Unsubscribing from ChangeRequestRaised events.');
      unsubscribe();
    };
  }, [currentUserId]); // Removed 'quotations' from dependencies as it's no longer used as a prop

  // This component does not render any visible UI
  return null;
}

export default QuotationSubscriberToChangeRequest;

// src/domain/features/onHoldQuotation/commandHandler.js
// Handles commands related to putting a quotation on hold.

import { eventBus } from '../../core/eventBus';
import { onHoldQuotationEventStore, quotationEventStore, quoteApprovalEventStore } from '../../core/eventStore'; // Import quotation and approval event stores for state reconstruction
import { OnHoldQuotationAggregate } from './aggregate';

/**
 * Reconstructs the current state of a single quotation from its events.
 * This is crucial for the command handler to provide the aggregate with the necessary context.
 * @param {string} quotationId - The ID of the quotation to reconstruct.
 * @returns {object|null} The reconstructed quotation object or null if not found.
 */
const reconstructQuotationState = (quotationId) => {
  const allQuotationEvents = [
    ...quotationEventStore.getEvents(), // QuotationCreated events
    ...quoteApprovalEventStore.getEvents(), // QuoteApproved events
    ...onHoldQuotationEventStore.getEvents() // QuotationOnHold events
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let quotation = null;

  allQuotationEvents.forEach(event => {
    // Only process events relevant to the specific quotationId
    const targetId = event.type === 'QuoteApproved' ? event.data.quoteId : event.data.quotationId;

    if (targetId === quotationId) {
      if (event.type === 'QuotationCreated') {
        quotation = { ...event.data };
      } else if (quotation && event.type === 'QuoteApproved') {
        quotation.status = 'Approved';
      } else if (quotation && event.type === 'QuotationOnHold') {
        quotation.status = 'On Hold';
        quotation.onHoldReason = event.data.reason;
      }
    }
  });
  return quotation;
};


export const onHoldQuotationCommandHandler = {
  /**
   * Handles incoming commands for the On Hold Quotation domain.
   * @param {object} command - The command object to handle.
   * @param {string} command.type - The type of the command (e.g., 'PutQuotationOnHold').
   * @returns {object} An object indicating success and optionally the generated event.
   */
  handle(command) {
    console.log(`[OnHoldQuotationCommandHandler] Handling command: ${command.type}`, command);
    switch (command.type) {
      case 'PutQuotationOnHold':
        // Reconstruct the current state of the specific quotation for the aggregate's decision
        const currentQuotationState = reconstructQuotationState(command.quotationId);

        // Delegate to the OnHoldQuotationAggregate to create the event, passing the current state
        const event = OnHoldQuotationAggregate.putOnHold(command, currentQuotationState);
        
        if (event) { // Only proceed if the aggregate allowed the event to be created
          onHoldQuotationEventStore.append(event); // Append QuotationOnHoldEvent to its dedicated store
          eventBus.publish(event); // Publish QuotationOnHoldEvent
          return { success: true, event };
        } else {
          return { success: false, message: "Quotation cannot be put on hold based on its current status." };
        }

      default:
        console.warn(`[OnHoldQuotationCommandHandler] Unknown command type: ${command.type}`);
        return { success: false };
    }
  }
};

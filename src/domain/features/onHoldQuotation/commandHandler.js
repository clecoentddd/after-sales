// src/domain/features/onHoldQuotation/commandHandler.js
// Handles commands related to putting a quotation on hold.

import { eventBus } from '../../core/eventBus';
import { quotationEventStore, quoteApprovalEventStore, onHoldQuotationEventStore } from '../../core/eventStore'; 
import { OnHoldQuotationAggregate } from './aggregate';

/**
 * Reconstructs the current state of a single quotation from its events.
 * This is crucial for the command handler to provide the aggregate with the necessary context.
 * It considers QuotationCreated, QuoteApproved, and QuotationOnHold events to build the state.
 * @param {string} quotationId - The ID of the quotation to reconstruct.
 * @returns {object|null} The reconstructed quotation object or null if not found.
 */
const reconstructQuotationState = (quotationId) => {
  // Combine all relevant event types for the quotation and sort them chronologically
  const allQuotationEvents = [
    ...quotationEventStore.getEvents(), 
    ...quoteApprovalEventStore.getEvents(), 
    ...onHoldQuotationEventStore.getEvents() 
  ].sort((a, b) => new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime());

  let quotation = null;

  allQuotationEvents.forEach(event => {
    // Determine the relevant ID for filtering, as QuoteApproved uses 'quoteId'
    const targetId = event.type === 'QuoteApproved' ? event.data.quoteId : event.data.quotationId;

    if (targetId === quotationId) {
      if (event.type === 'QuotationCreated') {
        quotation = { ...event.data }; // Initialize or update with creation data
      } else if (quotation && event.type === 'QuoteApproved') {
        quotation.status = 'Approved'; // Update status to Approved
      } else if (quotation && event.type === 'QuotationOnHold') {
        quotation.status = 'On Hold'; // Update status to On Hold
        quotation.onHoldReason = event.data.reason; // Store the reason
      }
      // Add more event types here if they affect the quotation's state
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
        // Reconstruct the current state of the specific quotation for the aggregate to validate
        const currentQuotationState = reconstructQuotationState(command.quotationId);
        console.log(`[OnHoldQuotationCommandHandler] Reconstructed quotation state for ${command.quotationId}:`, currentQuotationState);

        // Pass the command and the current quotation state to the aggregate
        const event = OnHoldQuotationAggregate.putOnHold(command, currentQuotationState);
        
        if (event) { 
          onHoldQuotationEventStore.append(event); // Persist the event
          eventBus.publish(event); // Publish the event for read models to react
          return { success: true, event };
        } else {
          // If aggregate returns null, it means the command was not applicable based on business rules
          console.warn(`[OnHoldQuotationCommandHandler] Command '${command.type}' failed for quotation ${command.quotationId}. Reason: Not applicable based on current state.`);
          // In a UI context, you might want to show a user-friendly message here.
          // For now, we return success: false and a message.
          return { success: false, message: "Quotation cannot be put on hold based on its current status or because it wasn't found." };
        }

      default:
        console.warn(`[OnHoldQuotationCommandHandler] Unknown command type: ${command.type}`);
        return { success: false, message: `Unknown command type: ${command.type}` };
    }
  }
};

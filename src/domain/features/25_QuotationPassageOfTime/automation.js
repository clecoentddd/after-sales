// src/domain/features/quotationHoldingAutomation/automation.js
// This module provides automation logic to put a pending quotation on hold.

import { onHoldQuotationCommandHandler } from '../21_PutQuotationOnHold/commandHandler';
import { PutQuotationOnHoldCommand } from '../21_PutQuotationOnHold/commands';

/**
 * Automatically attempts to put a quotation on hold if it is in 'Draft' or 'Pending' status.
 * This function is typically called by an event subscriber (e.g., QuotationApprovalMonitor)
 * when a 'QuotationCreated' event occurs.
 *
 * @param {string} quoteId - The ID of the quotation to potentially put on hold.
 * @param {string} heldByUserId - The ID of the user (or system) initiating the hold.
 * @param {Array<object>} allCurrentQuotations - The current read model array of all quotations, used to check quotation status.
 */
export const putQuotationOnHoldAutomaticallyIfPendingApproval = (quoteId, heldByUserId, allCurrentQuotations) => {
  console.log(`[QuotationHoldingAutomation] Attempting to put quotation ${quoteId} on hold if pending approval.`);

  // Find the specific quotation from the provided read model
  const quotationToConsider = allCurrentQuotations.find(q => q.quoteId === quoteId);

  // Business rule: Only 'Draft' or 'Pending' quotations should be automatically put on hold.
  // This check is performed *before* dispatching the command to avoid unnecessary command handling.
  if (quotationToConsider && (quotationToConsider.status === 'Draft' || quotationToConsider.status === 'Pending')) {
    console.log(`[QuotationHoldingAutomation] Quotation ${quoteId} is in status '${quotationToConsider.status}'. Dispatching PutQuotationOnHoldCommand.`);
    
    // Dispatch the command to put the quotation on hold
    onHoldQuotationCommandHandler.handle(
      PutQuotationOnHoldCommand(
        quoteId,
        heldByUserId,
        'Automatic hold: Quotation not approved within expected timeframe (or other automation reason).'
      )
    );
  } else {
    console.log(`[QuotationHoldingAutomation] Quotation ${quoteId} not found or not in 'Draft'/'Pending' status (Current: ${quotationToConsider?.status || 'Not Found'}). Skipping automatic hold.`);
  }
};

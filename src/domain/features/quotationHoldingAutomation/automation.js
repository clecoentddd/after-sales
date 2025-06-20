// src/domain/features/quotationHoldingAutomation/automation.js
// This module provides automation logic to attempt to put a quotation on hold.
// The actual business rule validation (e.g., if it's already approved)
// is now enforced by the OnHoldQuotationAggregate.

import { onHoldQuotationCommandHandler } from '../onHoldQuotation/commandHandler';
import { PutQuotationOnHoldCommand } from '../onHoldQuotation/commands';

/**
 * Attempts to dispatch a command to put a quotation on hold.
 * The responsibility for checking the quotation's eligibility (e.g., if it's pending approval)
 * now resides within the OnHoldQuotationAggregate itself.
 * This function simply reflects the intent to put a quotation on hold.
 *
 * @param {string} quotationId - The ID of the quotation to put on hold.
 * @param {string} userId - The user ID who initiated this action (or a system user ID).
 */
export const putQuotationOnHoldAutomaticallyIfPendingApproval = (quotationId, userId) => {
  console.log(`[QuotationHoldingAutomation] Dispatching command to put quotation ${quotationId} on hold.`);

  // Dispatch the command. The aggregate will handle the status validation.
  onHoldQuotationCommandHandler.handle(
    PutQuotationOnHoldCommand(
      quotationId,
      userId, // User who triggered the automation (e.g., system user)
      `Automatic hold: Quotation not approved within expected timeframe (or other automation reason).`
    )
  );
};

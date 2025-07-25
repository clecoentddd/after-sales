// src/domain/features/onHoldQuotation/aggregate.js
// Defines the OnHoldQuotationAggregate, responsible for creating QuotationOnHoldEvent.

import { QuotationOnHoldEvent } from './events';

export class OnHoldQuotationAggregate {
  /**
   * Static method to process a PutQuotationOnHoldCommand, emitting a QuotationOnHoldEvent.
   * This aggregate includes logic to validate the current state of the quotation
   * before allowing it to be put on hold.
   *
   * @param {object} command - The command object (e.g., PutQuotationOnHoldCommand).
   * @param {object} currentQuotationState - The current reconstructed state of the quotation (from `commandHandler.js`).
   * @returns {object|null} A QuotationOnHoldEvent if valid, otherwise null.
   */
  static putOnHold(command, currentQuotationState) {
    console.log(`[OnHoldQuotationAggregate] Attempting to put quotation ${command.quotationId} on hold.`);

    if (!currentQuotationState) {
      console.warn(`[OnHoldQuotationAggregate] Cannot put quotation ${command.quotationId} on hold: Quotation state not found.`);
      return null;
    }

    // Business rule: Only 'Draft' or 'Pending' quotations can be put on hold.
    if (currentQuotationState.status === 'Draft' || currentQuotationState.status === 'Pending') {
      console.log(`[OnHoldQuotationAggregate] Quotation ${command.quotationId} is in status '${currentQuotationState.status}'. Emitting QuotationOnHoldEvent.`);
      return QuotationOnHoldEvent(
        command.quotationId,
        currentQuotationState.requestId, // Get requestId from the reconstructed state
        null, // For now, changeRequestId is null as this is manual
        command.heldByUserId,
        command.reason
      );
    } else {
      console.warn(`[OnHoldQuotationAggregate] Cannot put quotation ${command.quotationId} on hold: Current status is '${currentQuotationState.status}'. Only 'Draft' or 'Pending' can be put on hold.`);
      return null; // Do not emit event if business rule is violated
    }
  }
}

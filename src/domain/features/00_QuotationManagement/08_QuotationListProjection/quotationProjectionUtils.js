// Insert new quotation if not present
export function insertNewQuotation(quotations, newQuotation) {
  console.log('[insertNewQuotation] Attempting to insert from existing quotations:', quotations);
  console.log('[insertNewQuotation] Attempting to insert newQuotation:', newQuotation);

  if (!newQuotation.quotationId || !newQuotation.requestId || !newQuotation.changeRequestId) {
    throw new Error('Invalid quotation data: must include quotationId, requestId, and changeRequestId');
  }

  if (quotations.some(q => q.quotationId === newQuotation.quotationId)) {
    console.log(`[insertNewQuotation] Quotation with ID ${newQuotation.quotationId} already exists. Skipping insertion.`);
    return quotations; // already exists
  }

  const updatedQuotations = [
    ...quotations,
    {
      quotationId: newQuotation.quotationId,
      requestId: newQuotation.requestId,
      changeRequestId: newQuotation.changeRequestId,
      estimatedAmount: newQuotation.estimatedAmount || 0,
      status: newQuotation.status || 'Draft',
    }
  ];

  console.log('[insertNewQuotation] Quotation inserted:', newQuotation);
  return updatedQuotations;
}

// Update status of an existing quotation
export function updateExistingQuotationStatus(quotations, quotationId, status) {
  console.log(`[updateExistingQuotationStatus] Attempting to update status of quotation ${quotationId} to '${status}'`);

  const idx = quotations.findIndex(q => q.quotationId === quotationId);
  if (idx === -1) {
    throw new Error(`Quotation with ID ${quotationId} not found.`);
  }

  const updatedQuotations = [
    ...quotations.slice(0, idx),
    { ...quotations[idx], status },
    ...quotations.slice(idx + 1)
  ];

  console.log(`[updateExistingQuotationStatus] Status updated for quotation ${quotationId}`);
  return updatedQuotations;
}

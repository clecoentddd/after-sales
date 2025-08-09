export function useQuotationSlice() {
  console.warn('useQuotationSlice is deprecated, please use the new quotation projection APIs instead');

  return {
    quotations: [],
    quotationEvents: []
  };
}
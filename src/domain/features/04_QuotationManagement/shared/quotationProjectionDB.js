// domain/features/04_QuotationManagement/08_QuotationListProjection/quotationProjectionDB.js

let quotations = [];

export const queryQuotationsProjection = () => quotations;

export const setQuotationsProjection = (newQuotations) => {
  quotations = newQuotations;
};

export const clearQuotationsProjectionDB = () => {
  quotations = [];
};

// domain/features/04_QuotationManagement/08_QuotationListProjection/globalQuotationInit.js

import { initializeQuotationCreatedProjectionHandler } from '../08_QuotationListProjection/QuotationCreatedProjectionHandler';
import { initializeQuotationApprovedProjectionHandler } from '../10_UpdateProjectionOnApproval/QuotationApprovedProjectionHandler';
import { initializeQuotationOnHoldProjectionHandler } from '../22_QuotationOnHoldProjection/QuotationOnHoldProjectionHandler';
import { initializeQuotationRequestRaisedEventHandler } from '../07_CreateQuotation/eventHandler';
export const globalQuotationInit = () => {
  console.log('[GlobalQuotationInit] Initializing all Quotation projection handlers...');
  
  initializeQuotationRequestRaisedEventHandler(); // received events from RequestRaised
  initializeQuotationCreatedProjectionHandler();
  initializeQuotationApprovedProjectionHandler();
  initializeQuotationOnHoldProjectionHandler();
  
  console.log('[GlobalQuotationInit] All handlers initialized.');
};

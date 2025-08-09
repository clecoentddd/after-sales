// domain/features/00_QuotationManagement/08_QuotationListProjection/globalQuotationInit.js

import { initializeRequestRaisedHandler } from '../06_RequestListProjection/requestRaisedProjectionHandler';
import { initializeRequestClosedHandler } from '../28_ProjectionClosedRequest/requestClosedProjectionHandler';

export const globalRequestInit = () => {
  console.log('[globalRequestInit] Initializing all request projection handlers...');
  
  initializeRequestRaisedHandler(); // received events from RequestRaised
  initializeRequestClosedHandler();
 
  
  console.log('[globalRequestInit] All handlers initialized.');
};

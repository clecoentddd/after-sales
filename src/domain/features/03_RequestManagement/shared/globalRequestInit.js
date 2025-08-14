// domain/features/04_QuotationManagement/08_QuotationListProjection/globalQuotationInit.js

import { initializeRequestRaisedHandler } from '../0302_RequestListProjection/requestRaisedProjectionHandler';
import { initializeRequestClosedHandler } from '../28_ProjectionClosedRequest/requestClosedProjectionHandler';

export const globalRequestInit = () => {
  console.log('[globalRequestInit] Initializing all request projection handlers...');
  
  initializeRequestRaisedHandler(); // received events from RequestRaised
  initializeRequestClosedHandler();
 
  
  console.log('[globalRequestInit] All handlers initialized.');
};

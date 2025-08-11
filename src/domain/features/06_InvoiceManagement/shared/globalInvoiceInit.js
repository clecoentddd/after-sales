// globalInvoiceInit.js
import { initializeInvoiceToDoHandler } from '../01_InvoicesToRaise/AddInvoicesToDo';
import { initializeInvoiceProcessHandler } from '../03_InvoicesProcessing/toDoProcessor';
import { buildLiveModel } from '../02_ProjectionRaisingInvoicesToDo/liveModel';

// Global initialization function
export const globalInvoiceInit = () => {
  console.log('[GlobalInvoiceInit] Initializing invoice processing system...');

  // Build the live model
  buildLiveModel();
  console.log('[GlobalInvoiceInit] Live model built successfully.');

  // Initialize the processors
  initializeInvoiceToDoHandler();
  initializeInvoiceProcessHandler();

  console.log('[GlobalInvoiceInit] Invoice processing system initialized successfully.');

};

// Call the global initialization function to start the system
const initializedLiveModelState = globalInvoiceInit();

// If you need to use the liveModelState elsewhere, you can export it or use it directly
export { initializedLiveModelState };

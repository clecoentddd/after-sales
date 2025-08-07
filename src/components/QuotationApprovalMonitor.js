import { useEffect } from 'react';
import { eventBus } from '../domain/core/eventBus';
// NEW: Import the automation function for putting quotations on hold
import { putQuotationOnHoldAutomaticallyIfPendingApproval } from '../domain/features/00_QuotationManagement/25_QuotationPassageOfTime/automation'; 

/**
 * QuotationApprovalMonitor component.
 * This component acts as a state view slice that subscribes to 'QuotationCreated' events.
 * Its purpose is to monitor for newly created quotations and trigger the automation
 * to attempt putting them on hold if they are not approved.
 * It renders nothing visible to the user.
 *
 * @param {string} currentUserId - The ID of the current user (or system user in this context).
 * @param {Array<object>} quotations - The current list of quotations (read model) to check status.
 */
function QuotationApprovalMonitor({ currentUserId, quotations }) { // Add 'quotations' prop
  useEffect(() => {
    console.log('[QuotationApprovalMonitor] Subscribing to QuotationCreated events.');

    const unsubQuotationCreated = eventBus.subscribe('QuotationCreated', (event) => {
      console.log(`[QuotationApprovalMonitor] Received QuotationCreated event:`, event);
      
      // Call the automation logic. The automation will now trigger the command,
      // and the aggregate will handle the validity check against its internal state.
      putQuotationOnHoldAutomaticallyIfPendingApproval(
        event.data.quotationId, 
        currentUserId, // Use the current system user for the hold action
        quotations // Pass the current quotations read model for the automation to check state
      );
    });

    // Cleanup function to unsubscribe when the component unmounts
    return () => {
      console.log('[QuotationApprovalMonitor] Unsubscribed from QuotationCreated events.');
      unsubQuotationCreated();
    };
  }, [currentUserId, quotations]); // Depend on 'currentUserId' and 'quotations'

  // This component does not render any visible UI
  return null;
}

export default QuotationApprovalMonitor;

import { useEffect } from 'react';
import { eventBus } from '../domain/core/eventBus';
import { putQuotationOnHoldAutomaticallyIfPendingApproval } from '../domain/features/quotationHoldingAutomation/automation';

/**
 * QuotationApprovalMonitor component.
 * This component acts as a state view slice that subscribes to 'QuotationCreated' events.
 * Its purpose is to monitor for newly created quotations and trigger the automation
 * to attempt putting them on hold if they are not approved.
 * It renders nothing visible to the user.
 *
 * @param {string} currentUserId - The ID of the current user (or system user in this context).
 */
function QuotationApprovalMonitor({ currentUserId }) { // 'quotations' prop removed
  useEffect(() => {
    console.log('[QuotationApprovalMonitor] Subscribing to QuotationCreated events.');

    const unsubQuotationCreated = eventBus.subscribe('QuotationCreated', (event) => {
      console.log(`[QuotationApprovalMonitor] Received QuotationCreated event:`, event);
      
      // Call the automation logic. The automation will now trigger the command,
      // and the aggregate will handle the validity check against its internal state.
      putQuotationOnHoldAutomaticallyIfPendingApproval(
        event.data.quotationId, 
        currentUserId // Use the current system user for the hold action
      );
    });

    // Cleanup function to unsubscribe when the component unmounts
    return () => {
      console.log('[QuotationApprovalMonitor] Unsubscribed from QuotationCreated events.');
      unsubQuotationCreated();
    };
  }, [currentUserId]); // Depend on 'currentUserId'

  // This component does not render any visible UI
  return null;
}

export default QuotationApprovalMonitor;

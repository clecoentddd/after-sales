// src/domain/features/RejectChangeRequestAssignment/commandHandler.js

import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore';
import { ChangeRequestAssignmentRejectedEvent } from '@events/changeRequestAssignmentRejectedEvent';

export const RejectChangeRequestAssignmentCommandHandler = {
  handle: (command) => {
    // Validate the command structure
    if (!command || !command.data) {
      console.error('[RejectChangeRequestAssignmentCommandHandler] Invalid command structure:', command);
      return;
    }

    const { changeRequestId, requestId, userId, reason } = command.data;
    console.log(`[RejectChangeRequestAssignmentCommandHandler] Rejecting assignment of change request ${changeRequestId} for request ${requestId} by user ${userId}: ${reason}`);

    // Create and publish the ChangeRequestAssignmentRejected event
    const rejectionEvent = ChangeRequestAssignmentRejectedEvent( requestId, changeRequestId, reason);
    console.log(`[RejectChangeRequestAssignmentCommandHandler] Created ChangeRequestAssignmentRejected event:`, rejectionEvent);
    jobEventStore.append(rejectionEvent);
    eventBus.publish(rejectionEvent);
  }
};

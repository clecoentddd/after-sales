// src/domain/features/RejectChangeRequestAssignment/commandHandler.js

import { eventBus } from '../../core/eventBus';
import { ChangeRequestAssignmentRejectedEvent } from '../../events/changeRequestAssignmentRejectedEvent';

export const RejectChangeRequestAssignmentCommandHandler = {
  handle: (command) => {
    // Validate the command structure
    if (!command || !command.data) {
      console.error('[CommandHandler] Invalid command structure:', command);
      return;
    }

    const { changeRequestId, requestId, userId, reason } = command.data;

    console.log(`[CommandHandler] Rejecting assignment of change request ${changeRequestId} for request ${requestId} by user ${userId}: ${reason}`);

    // Create and publish the ChangeRequestAssignmentRejected event
    const rejectionEvent = ChangeRequestAssignmentRejectedEvent(changeRequestId, requestId, reason);
    eventBus.publish(rejectionEvent);
  }
};

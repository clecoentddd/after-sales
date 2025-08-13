// src/domain/features/31_RejectJobOnChangeRequest/commandHandler.js

import { eventBus } from '../../../core/eventBus';
import { ChangeRequestRejectedEvent } from '../../../events/changeRequestRejectedEvent';

export const RejectChangeRequestCommandHandler = {
  handle: (command) => {
    if (!command || !command.data) {
      console.error('[CommandHandler] Invalid command structure:', command);
      return;
    }

    const { changeRequestId, requestId, userId, reason } = command.data;

    console.log(`[CommandHandler] Rejecting change request ${changeRequestId} for request ${requestId} by user ${userId}: ${reason}`);

    // Create and publish the ChangeRequestRejected event with requestId
    const rejectionEvent = ChangeRequestRejectedEvent(requestId, changeRequestId, reason);
    eventBus.publish(rejectionEvent);
  }
};


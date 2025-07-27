// src/domain/features/completeJob/eventHandler.js

import { eventBus } from '../../core/eventBus';
import { closeRequestCommandHandler } from './commandHandler'; // adjust path as needed

let isCompleteJobEventHandlerInitialized = false;

/**
 * Initializes the CompleteJob event handler by subscribing to 'JobCompleted' events.
 * This function is idempotent — calling it multiple times won't create duplicate subscriptions.
 */
export const initializeCompleteJobEventHandler = () => {
  if (isCompleteJobEventHandlerInitialized) {
    console.warn('[CompleteJobEventHandler] Already initialized. Skipping re-subscription.');
    return;
  }

  eventBus.subscribe('JobCompleted', (event) => {
    console.log('[CompleteJobEventHandler] Received JobCompleted event:', event);

    const { requestId } = event.data;

    if (!requestId) {
      console.error('[CompleteJobEventHandler] Missing requestId in JobCompleted event data');
      return;
    }

    // Call the command handler to close the request for this job's requestId
    const command = {
      type: 'CloseRequest',
      requestId,
      closedByUserId: event.data.completedByUserId,
      closedAt: new Date().toISOString(),
    };

    try {
      const result = closeRequestCommandHandler.handle(command);
      if (result.success) {
        console.log(`[CompleteJobEventHandler] Request ${requestId} closed successfully.`);
      } else {
        console.error(`[CompleteJobEventHandler] Failed to close request ${requestId}:`, result.message);
      }
    } catch (error) {
      console.error('[CompleteJobEventHandler] Error handling CloseRequest command:', error);
    }
  });

  isCompleteJobEventHandlerInitialized = true;
  console.log('[CompleteJobEventHandler] Subscribed to JobCompleted events.');
};

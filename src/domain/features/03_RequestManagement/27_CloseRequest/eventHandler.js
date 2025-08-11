// src/domain/features/completeJob/eventHandler.js

import { eventBus } from '@core/eventBus';
import { closeRequestCommandHandler } from './commandHandler'; // adjust path as needed
import { CloseRequestCommand } from './commands'; // adjust path as needed

let isCompleteJobEventHandlerInitialized = false;

/**
 * Initializes the CompleteJob event handler by subscribing to 'JobCompleted' events.
 * This function is idempotent — calling it multiple times won't create duplicate subscriptions.
 */
export const initializeCompleteJobEventHandler = () => {
  if (isCompleteJobEventHandlerInitialized) {
    console.warn('[Request: CompleteJobEventHandler] Already initialized. Skipping re-subscription.');
    return;
  }

  eventBus.subscribe('JobCompleted', (event) => {
    console.log('[Request: CompleteJobEventHandler] Received JobCompleted event:', event);

    const requestId = event.data.requestId;
    const changeRequestId = event.data.changeRequestId;
    console.log(`[Request: CompleteJobEventHandler] Processing JobCompleted for requestId: ${requestId}, changeRequestId: ${changeRequestId}`);

    if (!requestId || !changeRequestId) {
      console.error(`[Request: CompleteJobEventHandler] Missing requestId in JobCompleted event data, either ${requestId} or ${changeRequestId} is undefined. Cannot close request.`);
      return;
    }


    // Create the command instance
    const command = new CloseRequestCommand(requestId, changeRequestId);
    console.log(`[Request: CompleteJobEventHandler] Created CloseRequest command:`, command);

    try {
      console.log(`[Request: CompleteJobEventHandler] Closing request ${command.type} ...`);
      const result = closeRequestCommandHandler.handle(command);
      if (result.success) {
        console.log(`[Request: CompleteJobEventHandler] Request ${requestId} closed successfully.`);
      } else {
        console.error(`[Request: CompleteJobEventHandler] Failed to close request ${requestId}:`, result.message);
      }
    } catch (error) {
      console.error('[Request: CompleteJobEventHandler] Error handling CloseRequest command:', error);
    }
  });

  // Mark as initialized *after* subscribing
  isCompleteJobEventHandlerInitialized = true;
  console.log('[Request: CompleteJobEventHandler] Subscribed to JobCompleted events.');
};

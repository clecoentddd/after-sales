// src/domain/features/changeRequested/events.js
// Defines the ChangeRequestRaisedEvent.

import { v4 as uuidv4 } from 'uuid';

/**
 * Factory function for creating a ChangeRequestRaisedEvent.
 * This event signifies that a change request has been raised against an existing request.
 * @param {string} changeRequestId - Unique ID of the change request.
 * @param {string} requestId - The ID of the original request.
 * @param {string} changedByUserId - The ID of the user who raised the change.
 * @param {string} description - The description of the change.
 * @returns {object} The ChangeRequestRaisedEvent object.
 */
export const ChangeRequestRaisedEvent = (requestId, changedByUserId, description) => ({
  type: 'ChangeRequestRaised', // Event type identifier
  data: {
    changeRequestId: uuidv4(), // Generate a unique ID for the change request event
    requestId,
    changedByUserId,
    description,
    raisedAt: new Date().toISOString(), // Timestamp of when the change request was raised
    status: 'Pending' // Initial status of the change request
  },
  metadata: {
    timestamp: new Date().toISOString()
  }
});

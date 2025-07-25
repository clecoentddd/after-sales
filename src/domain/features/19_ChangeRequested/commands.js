// src/domain/features/changeRequested/commands.js
// Defines commands related to raising a change request.

/**
 * Factory function for creating a ChangeRequestRaisedCommand.
 * This command is used to initiate a change request against an existing request.
 * @param {string} requestId - The ID of the original request against which the change is being raised.
 * @param {string} changedByUserId - The ID of the user raising the change request.
 * @param {string} description - A description of the requested change.
 * @returns {object} The ChangeRequestRaisedCommand object.
 */
export const ChangeRequestRaisedCommand = (requestId, changedByUserId, description) => ({
  type: 'ChangeRequestRaised', // Command type identifier
  requestId,
  changedByUserId,
  description,
});
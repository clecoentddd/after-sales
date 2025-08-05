// src/domain/features/99_changeRequestToJobReactionProcessor/assignStartedJobToChangeRequestCommandHandler.js
export const AssignStartedJobToChangeRequestCommandHandler = {
  handle: (command) => {
    console.log('[AssignStartedJobCommandHandler] Handling command:', command);
    // Add your business logic here for assigning started jobs to change requests
    // This could include validation, state changes, etc.
    return { success: true, message: 'Started job assigned to change request successfully' };
  }
};
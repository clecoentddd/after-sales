// src/domain/features/25_RejectChangeRequest/commandHandler.js
export const rejectChangeRequestCommandHandler = {
  handle: (command) => {
    console.log(`[Stub] Rejecting ChangeRequest ${command.changeRequestId}: ${command.reason}`);
  }
};

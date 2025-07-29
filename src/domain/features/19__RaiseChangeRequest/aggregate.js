// src/domain/features/changeRequested/aggregate.js
import { ChangeRequestRaisedEvent } from './events';
import { ChangeRequestRejectedEvent } from './events';

export class ChangeRequestAggregate {
  static raiseChangeRequest(command) {
    return ChangeRequestRaisedEvent(
      command.changeRequestId,
      command.requestId,
      command.changedByUserId,
      command.description
    );
  }

  static rejectChangeRequest(command) {
    return ChangeRequestRejectedEvent(
      command.changeRequestId,
      command.requestId,
      command.reason
    );
  }
}

// src/domain/features/changeRequested/aggregate.js
import { ChangeRequestRaisedEvent } from '../../events/changeRequestRaisedEvent';
import { ChangeRequestRejectedDueToClosedRequest } from '../../events/changeRequestRejectedDueToClosedRequest';

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
    return ChangeRequestRejectedDueToClosedRequest(
      command.changeRequestId,
      command.requestId,
      command.reason
    );
  }
}

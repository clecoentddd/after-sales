// src/domain/features/changeRequested/aggregate.js

import { ChangeRequestRaisedEvent } from './events';

export class ChangeRequestAggregate {
  static raiseChangeRequest(command) {
    return ChangeRequestRaisedEvent(
      command.changeRequestId,
      command.requestId,
      command.changedByUserId,
      command.description
    );
  }
}

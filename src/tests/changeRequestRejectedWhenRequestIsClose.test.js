// src/domain/features/19_ChangeRequested/__tests__/changeRequestRejectedWhenRequestIsClosed.test.js

import { ChangeRequestAggregate } from '../domain/features/19_ChangeRequested/aggregate';
import { ChangeRequestRaisedCommand } from '../domain/features/19_ChangeRequested/commands';

describe('Change Request Rules - reject changeRequest when request is closed', () => {
  const requestId = 'req-closed-001';
  const userId = 'user-1';
  const description = 'Update customer address';

  it('should reject raising a change request when request is closed', () => {
    // Given: a closed request aggregate state
    const closedRequestState = {
      requestId,
      status: 'Closed',
      changeRequests: []
    };

    // When: we try to raise a change request
    const command = ChangeRequestRaisedCommand(requestId, userId, description);

    // Then: aggregate should throw or reject with error
    expect(() => {
      ChangeRequestAggregate.raiseChangeRequest(command, closedRequestState);
    }).toThrow('Request is already closed. No change request is accepted');
  });
});

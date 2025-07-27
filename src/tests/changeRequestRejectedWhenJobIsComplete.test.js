// src/domain/features/19_ChangeRequested/__tests__/changeRequest.rules.test.js

import { ChangeRequestDecisionTreeProjection } from '../domain/features/19a_ChangeRequestDecisionTree/projection';
import { ChangeRequestRaisedCommand } from '../../domain/features/19a_ChangeRequestDecisionTree/commands';
import { changeRequestCommandHandler } from '../domain/features/19a_ChangeRequestDecisionTree/commandHandler';

describe('Change Request Rules - changeRequest not possible when job is complete', () => {
  const requestId = 'req-1234';
  const userId = 'user-1';
  const description = 'Please update address';

  beforeEach(() => {
    // Reset projection before each test
    ChangeRequestDecisionTreeProjection.handleEvent({
      type: 'RequestCreated',
      data: { requestId }
    });

    ChangeRequestDecisionTreeProjection.handleEvent({
      type: 'QuotationCreated',
      data: { requestId }
    });

    // Simulate job completion
    ChangeRequestDecisionTreeProjection.handleEvent({
      type: 'JobCompleted',
      data: { requestId }
    });
  });

  it('should throw error if job is completed for the request', () => {
    const command = ChangeRequestRaisedCommand(requestId, userId, description);

    expect(() => {
      changeRequestCommandHandler.handle(command);
    }).toThrow('ChangeRequest cannot be raised when a job is complete');
  });
});

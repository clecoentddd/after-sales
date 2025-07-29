import { changeRequestCommandHandler } from '../domain/features/19_ChangeRequested/commandHandler';
import { RaiseChangeRequestCommand } from '../domain/features/19_ChangeRequested/commands';
import { requestEventStore } from '../domain/core/eventStore';
import { RequestCreatedEvent } from '../domain/events/requestCreatedEvent';
import { RequestClosedEvent } from '../domain/events/requestClosedEvent';

describe('Change Request Rules - reject changeRequest when request is closed', () => {
  const requestId = 'req-closed-001';
  const userId = 'user-1';
  const description = 'Update customer address';

  beforeEach(() => {
    requestEventStore.clear(); // Reset the store for clean test
    requestEventStore.append(RequestCreatedEvent(requestId, 'customer-123', { title: 'Test' }, 'Pending'));
    requestEventStore.append(RequestClosedEvent(requestId));
  });

  it('should reject raising a change request when request is closed', () => {
    const command = RaiseChangeRequestCommand(requestId, userId, description);

    const result = changeRequestCommandHandler.handle(command);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Request is already closed. No change request is accepted');
  });
});

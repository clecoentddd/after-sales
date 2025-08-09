import { organizationEventStore } from '@core/eventStore';
import { organizationCommandHandler } from '../../features/01_OrganizationManagement/01_CreateOrganization/commandHandler';
import validator from 'validator';

describe('organizationCommandHandler', () => {
  beforeEach(() => {
    // Assuming eventStore has a clear/reset function
    if (organizationEventStore.clear) {
      organizationEventStore.clear();
    }
  });

  it('should create an OrganizationCreated event and store it', () => {
    const orgName = 'Test organization';

    const result = organizationCommandHandler.handle(orgName);
    console.log('Command Handler Result:', result.event);

    // Result structure
    expect(result.success).toBe(true);
    expect(result.event.type).toBe('OrganizationCreated');
    expect(result.event.aggregateType).toBe('Organization');
    expect(result.event.data.name).toBe(orgName);
    expect(validator.isUUID(result.event.aggregateId)).toBe(true);

    // Event store should contain the same event
    const events = organizationEventStore.getEvents();
    expect(events.length).toBe(1);

    const storedEvent = events[0];
    console.log('Stored Event:', storedEvent);
    expect(storedEvent.aggregateId).toBe(result.event.aggregateId);
  });
});

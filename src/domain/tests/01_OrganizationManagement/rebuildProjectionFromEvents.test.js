import { organizationEventStore } from '@core/eventStore';
import { rebuildOrganizationProjection } from '../../features/01_OrganizationManagement/02_OrganizationListProjection/rebuildOrganizationProjection'; // adjust path

describe('rebuildOrganizationProjection', () => {
  beforeEach(() => {
    // Clear the event store before each test
    organizationEventStore.clearEvents?.() || (organizationEventStore._events = []);
  });

  it('should rebuild organizations from stored OrganizationCreated events', () => {
    // Add two OrganizationCreated events to the event store
    const event1 = {
      type: 'OrganizationCreated',
      aggregateId: 'org-1',
      data: {  name: 'Organization One' },
      metadata: { timestamp: new Date().toISOString() }
    };
    const event2 = {
      type: 'OrganizationCreated',
      aggregateId: 'org-2',
      data: { name: 'Organization Two' },
      metadata: { timestamp: new Date().toISOString() }
    };

    organizationEventStore.append(event1);
    organizationEventStore.append(event2);

    // Call rebuild function
    const organizations = rebuildOrganizationProjection();

    // Expect to get an array with both organizations
    expect(organizations).toHaveLength(2);
    expect(organizations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ organizationId: 'org-1', name: 'Organization One' }),
        expect.objectContaining({ organizationId: 'org-2', name: 'Organization Two' })
      ])
    );
  });
});

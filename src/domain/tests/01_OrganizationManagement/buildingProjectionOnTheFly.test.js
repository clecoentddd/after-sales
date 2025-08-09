import { eventBus } from '@core/eventBus';

describe('Organization subscription', () => {
  it('should update projection on new OrganizationCreated events and fail on organizationId in data', (done) => {
    const organizations = [];

    function insertNewOrganization(org) {
      organizations.push(org);
    }

    const unsubscribe = eventBus.subscribe('OrganizationCreated', event => {
      insertNewOrganization({
        organizationId: event.aggregateId,
        ...event.data
      });

      if (organizations.length === 2) {
        expect(organizations).toHaveLength(2);

        // This will fail because organizationId is NOT inside event.data, but at event.aggregateId
        expect(organizations[1].organizationId).toBeDefined();

        unsubscribe();
        done();
      }
    });

    // These events simulate missing organizationId inside data, only at aggregateId
    eventBus.publish({
      type: 'OrganizationCreated',
      aggregateId: '1',
      data: { name: 'Org 1' }
    });
    eventBus.publish({
      type: 'OrganizationCreated',
      aggregateId: '2',
      data: { name: 'Org 2' }
    });
  });
});

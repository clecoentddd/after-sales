// src/stateViews/rebuildOrganizationProjection.js
import { organizationEventStore } from '@core/eventStore';
import { insertNewOrganization } from './organizationProjectionUtils';

/**
 * Rebuild the organization list projection from all past OrganizationCreated events.
 * @returns {Array} List of organizations [{ organizationId, name }, ...]
 */
export function rebuildOrganizationProjection() {
  console.log('Rebuilding organization projection...');
  const events = organizationEventStore.getEvents() || [];
console.log(`[rebuildOrganizationProjection] Total events: ${events.length}`);
events.forEach((event, index) => {
  console.log(`[rebuildOrganizationProjection] Event ${index + 1}:`, event);
});
  

  let organizations = [];

  for (const event of events) {
  if (event.type === 'OrganizationCreated') {
    const organizationId = event.aggregateId;  // <-- from event root
    const { name } = event.data;
    organizations = insertNewOrganization(organizations, { organizationId, name });
  }
}

  return organizations;
}

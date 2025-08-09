import { useState, useEffect } from 'react';
import { organizationEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';

export function useOrganizationEvents() {
  const [organizationEvents, setOrganizationEvents] = useState(organizationEventStore.getEvents());

  useEffect(() => {
    // Subscribe to any organization-related events
    const unsubCreate = eventBus.subscribe('OrganizationCreated', () => {
      setOrganizationEvents(organizationEventStore.getEvents());
    });

    // If you have more events like organizationUpdated, add them here
    // const unsubUpdate = eventBus.subscribe('organizationUpdated', ...)

    return () => {
      unsubCreate();
      // unsubUpdate();
    };
  }, []);

  return { organizationEvents };
}

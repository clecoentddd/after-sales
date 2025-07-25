// src/stateViews/useOrganizationSlice.js
import { useEffect, useState } from 'react';
import { organizationEventStore } from '../../core/eventStore';
import { eventBus } from '../../core/eventBus';

export function useOrganizationSlice() {
  const [organizations, setOrganizations] = useState([]);
  const [orgEvents, setOrgEvents] = useState([]);

  // Load existing events from the event store on mount
  useEffect(() => {
    const events = organizationEventStore.getEvents();
    setOrgEvents(events);
    const createdOrgs = events
      .filter(e => e.type === 'OrganizationCreated')
      .map(e => e.data);
    setOrganizations(createdOrgs);
  }, []);

  // Subscribe to new OrganizationCreated events
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('OrganizationCreated', (event) => {
      setOrganizations(prev => [...prev, event.data]);
      setOrgEvents(prev => [...prev, event]);
    });

    return () => unsubscribe(); // cleanup on unmount
  }, []);

  return {
    organizations,
    orgEvents
  };
}

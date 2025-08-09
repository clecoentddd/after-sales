import { useEffect, useState } from 'react';
import { eventBus } from '@core/eventBus';
import { rebuildOrganizationProjection } from './rebuildOrganizationProjection'; // import the new rebuild function
import { insertNewOrganization } from './organizationProjectionUtils'; // helper to add org

export function useProjectionOrganizationList() {
  const [organizations, setOrganizations] = useState([]);
  const [orgEvents, setOrgEvents] = useState([]);

  // On mount, rebuild projection from all past events
  useEffect(() => {
    console.log('[Projection] Starting rebuild of organization projection...');
    const rebuiltOrgs = rebuildOrganizationProjection();
    console.log(`[Projection] Rebuilt organizations from events:`, rebuiltOrgs);
    setOrganizations(rebuiltOrgs);
  }, []);

  // Subscribe to new OrganizationCreated events and update state incrementally
  useEffect(() => {
    console.log('[Projection] Subscribing to OrganizationCreated events...');
    const unsubscribe = eventBus.subscribe('OrganizationCreated', (event) => {
      console.log('[Projection] Received new OrganizationCreated event:', event);
      const organization = {
        organizationId: event.aggregateId,
        ...event.data
      };
      setOrganizations(prevOrgs => {
        const updatedOrgs = insertNewOrganization(prevOrgs, organization);
        console.log('[Projection] Updated organizations list:', updatedOrgs);
        return updatedOrgs;
      });
      setOrgEvents(prev => {
        const updatedEvents = [...prev, event];
        console.log('[Projection] Updated orgEvents list:', updatedEvents);
        return updatedEvents;
      });
    });

    return () => {
      console.log('[Projection] Unsubscribing from OrganizationCreated events...');
      unsubscribe();
    };
  }, []);

  return {
    organizations,
    orgEvents
  };
}

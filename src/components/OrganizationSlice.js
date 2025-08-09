import React, { useState, useEffect } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { organizationCommandHandler } from '../domain/features/01_OrganizationManagement/01_CreateOrganization/commandHandler';
import { useProjectionOrganizationList } from '../domain/features/01_OrganizationManagement/02_OrganizationListProjection/projectionOrganizationList';
import { rebuildOrganizationProjection } from '../domain/features/01_OrganizationManagement/02_OrganizationListProjection/rebuildOrganizationProjection';
import { useOrganizationEvents } from '../domain/features/01_OrganizationManagement/organizationManagementStream';

function OrganizationSlice() {
  // Listen to the event stream
  const { organizationEvents } = useOrganizationEvents();
  const [events, setEvents] = useState(organizationEvents);

  useEffect(() => {
    console.log('[OrganizationSlice] organizationEvents changed, syncing events...');
    setEvents(organizationEvents);
  }, [organizationEvents]);

  // Get projection if any
  const { organizations: organizationProjection } = useProjectionOrganizationList();
  const [organizations, setOrganizations] = useState(organizationProjection);

useEffect(() => {
  console.log('[OrganizationSlice] organizationProjection changed, syncing state...');
  setOrganizations(organizationProjection);
}, [organizationProjection]);

  const [orgName, setOrgName] = useState('');

  // Log what we receive from hooks
  console.log('[OrganizationSlice] organizationEvents:', organizationEvents);
  console.log('[OrganizationSlice] organizationProjection:', organizationProjection);
  console.log('[OrganizationSlice] local organizations state:', organizations);

  // Rebuild organizations projection **every time events change**
  useEffect(() => {
    console.log('[OrganizationSlice] organizationEvents changed, rebuilding projection...');
    const rebuiltOrgs = rebuildOrganizationProjection();
    console.log('[OrganizationSlice] rebuiltOrgs:', rebuiltOrgs);
    setOrganizations(rebuiltOrgs);
  }, [organizationEvents]);

  const handleRebuild = async () => {
    console.log('[OrganizationSlice] Rebuild button clicked');
    setOrganizations([]); // Show empty UI for 0.5 sec
    await new Promise(resolve => setTimeout(resolve, 500));

    const rebuiltOrgs = rebuildOrganizationProjection();
    console.log('[OrganizationSlice] rebuiltOrgs after manual rebuild:', rebuiltOrgs);
    setOrganizations(rebuiltOrgs);
  };

  const handleCreateOrg = (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    organizationCommandHandler.handle(orgName.trim());
    setOrgName('');
  };

  return (
    <div className="aggregate-block">
      <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Organization Setup
        <button
          onClick={handleRebuild}
          title="Rebuild Projection"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: 0,
            marginLeft: '1rem'
          }}
        >
          🔄
        </button>
      </h2>
      <div className="aggregate-columns">
        <div className="aggregate-column first-column">
          <h3>Create a new organization</h3>
          <form onSubmit={handleCreateOrg} className="command-form">
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
              required
            />
            <button type="submit">Create Organization</button>
          </form>
        </div>
        <div className="aggregate-column second-column">
          <ReadModelDisplay
            items={organizations}
            idKey="organizationId"
            renderDetails={(org) => (
              <>
                <strong>{org.name}</strong>
                <small>ID: {org.organizationId?.slice(0, 40) ?? 'No event received yet'}...</small>
              </>
            )}
          />
        </div>
        <div className="aggregate-column third-column">
          <EventLogDisplay events={events} />
        </div>
      </div>
    </div>
  );
}

export default OrganizationSlice;

import React, { useState } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { organizationCommandHandler } from '../domain/features/01_CreateOrganization/commandHandler';

function OrganizationSlice({ organizations, orgEvents }) {
  const [orgName, setOrgName] = useState('');

  const handleCreateOrg = (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    
    organizationCommandHandler.handle({ 
      type: 'CreateOrganization', 
      name: orgName.trim() 
    });
    setOrgName('');
  };

return (
  <div className="aggregate-block">
    <h2>Organization Aggregate</h2>
    <div className="aggregate-columns">
      <div className="aggregate-column first-column">
        <h3>Create a new organisation</h3>
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
              <small>ID: {org.organizationId.slice(0, 8)}...</small>
            </>
          )}
        />
      </div>

      <div className="aggregate-column third-column">
        <EventLogDisplay events={orgEvents} />
      </div>
    </div>
  </div>
);

}

export default OrganizationSlice;

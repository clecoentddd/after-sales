import React, { useState } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { customerCommandHandler } from '../domain/features/customer/commandHandler';

function CustomerSlice({ customers, customerEvents, organizations }) {
  const [customerName, setCustomerName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!customerName.trim() || !selectedOrgId) return;
    
    customerCommandHandler.handle({
      type: 'CreateCustomer',
      name: customerName.trim(),
      organizationId: selectedOrgId
    });
    
    setCustomerName('');
    setSelectedOrgId('');
  };

  return (
  <div className="aggregate-block">
    <h2>Customer Aggregate</h2>
    <div className="aggregate-columns">
      <div className="aggregate-column first-column">
        <h3>Create a customer for an organization</h3>
        <form onSubmit={handleCreateCustomer} className="command-form">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer name"
            required
          />
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            required
          >
            <option value="">Select Organization</option>
            {organizations.map(org => (
              <option key={org.organizationId} value={org.organizationId}>
                {org.name}
              </option>
            ))}
          </select>
          <button type="submit">Create Customer</button>
        </form>
      </div>

      <div className="aggregate-column second-column">
        <ReadModelDisplay
          items={customers}
          idKey="customerId"
          renderDetails={(customer) => {
            const org = organizations.find(o => o.organizationId === customer.organizationId);
            return (
              <>
                <strong>{customer.name}</strong>
                <small>Org: {org?.name || 'Unknown'}</small>
              </>
            );
          }}
        />
      </div>

      <div className="aggregate-column third-column">
        <EventLogDisplay events={customerEvents} />
      </div>
    </div>
  </div>
);

}

export default CustomerSlice;

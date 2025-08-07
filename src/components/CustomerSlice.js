import React, { useState } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { createCustomerCommandHandler } from '../domain/features/00_CustomerManagement/03_CreateCustomer/commandHandler';

function CustomerSlice({ customers, customerEvents, organizations }) {
  const [customerName, setCustomerName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [error, setError] = useState('');

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim() || customerName.trim().length < 2) {
      setError('Customer name must be at least 2 characters.');
      return;
    }

    if (!selectedOrgId) {
      setError('You must select an organization.');
      return;
    }

    console.log(`[CustomerSlice] Creating customer: ${customerName} for organization ID: ${selectedOrgId}`);
    createCustomerCommandHandler.handle({
      name: customerName.trim(),
      organizationId: selectedOrgId
    });

    setCustomerName('');
    setSelectedOrgId('');
  };

  return (
    <div className="aggregate-block">
      <h2>Customer Management</h2>
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
              {organizations.length === 0 ? (
                <option disabled>No organizations found</option>
              ) : (
                organizations.map(org => (
                  <option key={org.organizationId} value={org.organizationId}>
                    {org.name}
                  </option>
                ))
              )}
            </select>

            <button type="submit">Create Customer</button>

            {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
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

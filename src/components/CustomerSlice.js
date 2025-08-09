import React, { useState, useEffect } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { createCustomerCommandHandler } from '../domain/features/02_CustomerManagement/CreateCustomer/commandHandler';
import { useCustomerProjection } from '../domain/features/02_CustomerManagement/CustomerListProjection/useCustomerProjection';
import { useCustomerEvents } from '../domain/features/02_CustomerManagement/customerManagementStream';
import { rebuildCustomerProjection } from '../domain/features/02_CustomerManagement/CustomerListProjection/rebuildCustomerProjection';

function CustomerSlice({ organizations }) {
  const { customers: projectedCustomers } = useCustomerProjection();
  const { customerEvents } = useCustomerEvents();
  const [customerName, setCustomerName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);

  // Sync local state with projection data
  useEffect(() => {
    setCustomers(projectedCustomers);
  }, [projectedCustomers]);

  const handleRebuild = async () => {
    console.log('[CustomerSlice] Rebuild button clicked');
    setCustomers([]); // Clear the customers array immediately

    // Wait for a short period to show the empty state
    await new Promise(resolve => setTimeout(resolve, 500));

    // Rebuild the projection
    const rebuiltCustomers = await rebuildCustomerProjection();
    setCustomers(rebuiltCustomers);
  };

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
      <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Customer Management
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
              <option value="">Select organization</option>
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

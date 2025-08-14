import React, { useEffect, useState } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { RaiseRequestCommandHandler } from '../domain/features/03_RequestManagement/0301_RaiseRequest/commandHandler';
import { useCustomerProjection } from '../domain/features/02_CustomerManagement/CustomerListProjection/useCustomerProjection';
import { useRequestEvents } from '../domain/features/03_RequestManagement/requestManagementStream';
import { useRequestProjection } from '../domain/features/03_RequestManagement/shared/useRequestProjection';
import { rebuildRequestProjection } from '../domain/features/03_RequestManagement/shared/rebuildRequestProjection';

function RequestSlice() {
  const { customers } = useCustomerProjection();

  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const { requests: projectedRequests } = useRequestProjection();

    const { requestEvents } = useRequestEvents();

    React.useEffect(() => {
      console.log('[RequestSlice] requestEvents updated:', requestEvents);
    }, [requestEvents]);

    // Handling rebuild projection
    const [requests, setRequests] = useState([]);
     useEffect(() => {
        setRequests(projectedRequests);
      }, [projectedRequests]);

    const handleRebuild = async () => {
        console.log('[RequestSlice] Rebuild button clicked');
        setRequests([]); // Clear the customers array immediately
    
        // Wait for a short period to show the empty state
        await new Promise(resolve => setTimeout(resolve, 500));
    
        // Rebuild the projection
        const rebuiltRequests = await rebuildRequestProjection();
        setRequests(rebuiltRequests);
      };

  const handleRaiseRequest = (e) => {
    e.preventDefault();

    const title = requestTitle.trim();
    const description = requestDescription.trim();

    if (!title || !selectedCustomerId) {
      console.warn('Please enter a request title and select a customer.');
      return;
    }

    RaiseRequestCommandHandler.handle({
      customerId: selectedCustomerId,
      requestDetails: { title, description }
    });

    setRequestTitle('');
    setRequestDescription('');
    setSelectedCustomerId('');
  };

  return (
    <div className="aggregate-block">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Request Management</h2>
        <button
          onClick={handleRebuild}
          style={{
            fontSize: '0.85rem',
            padding: '2px 8px',
            background: 'none',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#555'
          }}
        >
          🔄 Rebuild
        </button>
      </div>
      <div className="aggregate-columns">
        <div className="aggregate-column first-column">
          <h3>Raise a request</h3>
          <form onSubmit={handleRaiseRequest} className="command-form">
            <input
              type="text"
              value={requestTitle}
              onChange={(e) => setRequestTitle(e.target.value)}
              placeholder="Request title"
              required
            />
            <textarea
              value={requestDescription}
              onChange={(e) => setRequestDescription(e.target.value)}
              placeholder="Request description (optional)"
              rows="3"
            ></textarea>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.customerId} value={customer.customerId}>
                  {customer.name}
                </option>
              ))}
            </select>
            <button type="submit">Create Request</button>
          </form>
        </div>

        <div className="aggregate-column second-column">
          <ReadModelDisplay
            items={requests}
            idKey="requestId"
            renderDetails={(request) => {
              const customer = customers.find(
                (c) => c.customerId === request.customerId
              );
              return (
                <>
                  <strong>{request.title}</strong>
                  <small>
                    For: {customer?.name || 'Unknown Customer'} <br />
                    Status: {request.status}
                  </small>
                </>
              );
            }}
          />
        </div>

        <div className="aggregate-column third-column">
          <EventLogDisplay events={requestEvents} />
        </div>
      </div>
    </div>
  );
}

export default RequestSlice;

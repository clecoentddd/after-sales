import React, { useState } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { RaiseRequestCommandHandler } from '../domain/features/00_RequestManagement/05_RaiseRequest/commandHandler';

function RequestSlice({ requests, requestEvents, customers }) {
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

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
      <h2>Request Management</h2>
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
                  <strong>{request.requestDetails.title}</strong>
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

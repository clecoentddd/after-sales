import React, { useState } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { requestCommandHandler } from '../domain/features/request/commandHandler';
import { CreateRequestCommand } from '../domain/features/request/commands';

function RequestSlice({ requests, requestEvents, customers }) {
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (!requestTitle.trim() || !selectedCustomerId) {
      console.warn("Please enter a request title and select a customer.");
      return;
    }
    
    requestCommandHandler.handle(
      CreateRequestCommand(
        selectedCustomerId,
        {
          title: requestTitle.trim(),
          description: requestDescription.trim(),
        }
      )
    );
    
    setRequestTitle('');
    setRequestDescription('');
    setSelectedCustomerId('');
  };

return (
  <div className="aggregate-block">
    <h2>Request Aggregate</h2>
    <div className="aggregate-columns">
      
      <div className="aggregate-column first-column">
        <h3>Raise a request</h3>
        <form onSubmit={handleCreateRequest} className="command-form">
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
            {customers.map(customer => (
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
            const customer = customers.find(c => c.customerId === request.customerId);
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

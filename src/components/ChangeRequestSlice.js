import React, { useState } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { changeRequestCommandHandler } from '../domain/features/19_ChangeRequested/commandHandler';
import { ChangeRequestRaisedCommand } from '../domain/features/19_ChangeRequested/commands';
import DecisionProjectionUI from '../domain/features/19a_ChangeRequestDecisionTree/ui';

function ChangeRequestSlice({ changeRequests, changeRequestEvents, requests, currentUserId }) {
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [changeDescription, setChangeDescription] = useState('');

  const handleChangeRequestRaised = (e) => {
    e.preventDefault();
    if (!selectedRequestId || !changeDescription.trim()) {
      console.warn("Please select a request and provide a description for the change.");
      return;
    }

    changeRequestCommandHandler.handle(
      ChangeRequestRaisedCommand(
        selectedRequestId,
        currentUserId,
        changeDescription.trim()
      )
    );

    setSelectedRequestId('');
    setChangeDescription('');
  };

  return (
    <div className="aggregate-block">
      <h2>Change Request Aggregate</h2>
      <div className="aggregate-columns">

        <div className="aggregate-column first-column">
          <h3>Select a request</h3>
          <form onSubmit={handleChangeRequestRaised} className="command-form">
            <select
              value={selectedRequestId}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              required
            >
              <option value="">Select Request to Change</option>
              {requests.map(request => {
                console.log('[ChangeRequestSlice] Rendering request option with ID:', request?.requestId);
                return (
                  <option key={request.requestId} value={request.requestId}>
                    {request.requestDetails.title} (ID: {request.requestId || 'Unknown ID'})
                  </option>
                );
              })}
            </select>
            <textarea
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              placeholder="Describe the requested change"
              rows="3"
              required
            ></textarea>
            <button type="submit">Raise Change Request</button>
          </form>
        </div>

        <div className="aggregate-column second-column">
          <ReadModelDisplay
            items={changeRequests}
            idKey="changeRequestId"
            renderDetails={(changeReq) => {
              const originalRequest = requests.find(req => req.requestId === changeReq.requestId);

              return (
                <>
                  {console.log('[ChangeRequestSlice] Rendering change request for:', changeReq?.requestId)}
<strong>Change for: {originalRequest?.requestDetails.title || 'Unknown Title'}</strong>
<small>
  Request ID: {changeReq.requestId || 'Missing ID'} <br />
  Description: {changeReq.description || 'No description'} <br />
                    Raised by: {changeReq.changedByUserId || 'N/A'} <br />
                    Status: {changeReq.status || 'N/A'}
                  </small>
                </>
              );
            }}
          />
        </div>

        <div className="aggregate-column third-column">
          <EventLogDisplay events={changeRequestEvents} />
        </div>
      </div>

      <DecisionProjectionUI />
    </div>
  );
}

export default ChangeRequestSlice;

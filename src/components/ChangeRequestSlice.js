import React, { useState } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { changeRequestCommandHandler } from '../domain/features/changeRequested/commandHandler';
import { RaiseChangeRequestCommand } from '../domain/features/changeRequested/commands';

function ChangeRequestSlice({ changeRequests, changeRequestEvents, requests, currentUserId }) {
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [changeDescription, setChangeDescription] = useState('');

  const handleRaiseChangeRequest = (e) => {
    e.preventDefault();
    if (!selectedRequestId || !changeDescription.trim()) {
      console.warn("Please select a request and provide a description for the change.");
      return;
    }

    changeRequestCommandHandler.handle(
      RaiseChangeRequestCommand(
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
        <div className="aggregate-column">
          <h3>Select a request</h3>
          <form onSubmit={handleRaiseChangeRequest} className="command-form">
            <select
              value={selectedRequestId}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              required
            >
              <option value="">Select Request to Change</option>
              {requests.map(request => (
                <option key={request.requestId} value={request.requestId}>
                  {request.requestDetails.title} (ID: {request.requestId.slice(0, 8)}...)
                </option>
              ))}
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
        <ReadModelDisplay
          items={changeRequests}
          idKey="changeRequestId"
          renderDetails={(changeReq) => {
            const originalRequest = requests.find(req => req.requestId === changeReq.requestId);
            return (
              <>
                <strong>Change for: {originalRequest?.requestDetails.title.slice(0, 30)}...</strong>
                <small>
                  Request ID: {changeReq.requestId.slice(0, 8)}... <br />
                  Description: {changeReq.description.slice(0, 40)}... <br />
                  Raised by: {changeReq.changedByUserId} <br />
                  Status: {changeReq.status}
                </small>
              </>
            );
          }}
        />
        <EventLogDisplay events={changeRequestEvents} />
      </div>
    </div>
  );
}

export default ChangeRequestSlice;

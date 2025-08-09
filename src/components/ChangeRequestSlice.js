import React, { useState } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { changeRequestCommandHandler } from '../domain/features/00_RequestManagement/19_RaiseChangeRequest/commandHandler';
import { RaiseChangeRequestCommand } from '../domain/features/00_RequestManagement/19_RaiseChangeRequest/commands';
import DecisionProjectionUI from '../domain/features/00_RequestManagement/19a_ChangeRequestDecisionTree/ui';
import { queryRequestsProjection } from '../domain/features/00_RequestManagement/shared/requestProjectionDB'; // Adjust the import path as necessary

function ChangeRequestSlice({ changeRequests, changeRequestEvents, currentUserId }) {
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Use the query function to get the requests data
  const requests = queryRequestsProjection();

  const handleChangeRequestRaised = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedRequestId || !changeDescription.trim()) {
      setError("Please select a request and provide a description for the change.");
      return;
    }
    const result = changeRequestCommandHandler.handle(
      new RaiseChangeRequestCommand(
        selectedRequestId,
        currentUserId,
        changeDescription.trim()
      )
    );
    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess("Change request raised successfully!");
      setSelectedRequestId('');
      setChangeDescription('');
    }
  };

  return (
    <div className="aggregate-block">
      <h2>Change Request Management</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
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
              {Array.isArray(requests) && requests.map(request => (
                <option key={request.requestId} value={request.requestId}>
                  {request.requestDetails.title} (ID: {request.requestId || 'Unknown ID'})
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
        <div className="aggregate-column second-column">
          <ReadModelDisplay
            items={changeRequests}
            idKey="changeRequestId"
            renderDetails={(changeReq) => {
              const originalRequest = requests.find(req => req.requestId === changeReq.requestId);
              return (
                <>
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

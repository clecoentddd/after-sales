import React, { useEffect, useState } from 'react';
import { ChangeRequestDecisionTreeProjection } from './projection';
import { rebuildProjection } from './rebuildProjection';
import './decisionProjection.css';

function DecisionProjectionUI() {
  const [allStates, setAllStates] = useState([]);
  const [lastRebuildTime, setLastRebuildTime] = useState(null);

  useEffect(() => {
    const unsubscribe = ChangeRequestDecisionTreeProjection.subscribe((data) => {
      console.log('[DecisionProjectionUI] Projection updated:', data);
      setAllStates(data);
    });
    return () => unsubscribe();
  }, []);

  const handleRefresh = () => {
  console.log('[DecisionProjectionUI] Refresh button clicked - rebuilding projection');

  // Rebuild the projection and get latest data
  const updatedData = rebuildProjection();

  // Update React state to force re-render
  setAllStates(updatedData);

  // Update rebuild timestamp
  setLastRebuildTime(new Date());
};

 const handleEmptyProjection = () => {
  console.log('[DecisionProjectionUI] Empty Projection button clicked - resetting projection');
  
  // Clear the projection
  ChangeRequestDecisionTreeProjection.reset();

  // Trigger a manual refresh from the projection to ensure UI reads latest data
  const latestData = ChangeRequestDecisionTreeProjection.getAll();
  setAllStates(latestData); // This will be an empty array after reset

  setLastRebuildTime(null); // Reset timestamp
};

  const formatTime = (date) => {
    if (!date) return null;
    return date.toTimeString().split(' ')[0];
  };

  return (
    <div className="projection-block">
      <h3>
        Request Status Projection (Quotation + Job + CR)
        <button
          onClick={handleEmptyProjection}
          style={{
            marginLeft: '1rem',
            padding: '0.25rem 0.5rem',
            cursor: 'pointer',
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
          title="Empty projection"
        >
          Empty Projection
        </button>
        <button
          onClick={handleRefresh}
          style={{
            marginLeft: '1rem',
            padding: '0.25rem 0.5rem',
            cursor: 'pointer',
            backgroundColor: '#4ECDC4',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
          title="Rebuild projection from all events"
        >
          Rebuild Projection
        </button>
        {lastRebuildTime && (
          <span className="rebuild-timestamp" style={{
            marginLeft: '1rem',
            fontSize: '0.9rem',
            color: '#666',
            fontStyle: 'italic'
          }}>
            Last rebuilt: {formatTime(lastRebuildTime)}
          </span>
        )}
      </h3>

      {allStates.length === 0 ? (
        <p><em>No request projections available.</em></p>
      ) : (
        <table className="projection-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Quotation Status</th>
              <th>Job Status</th>
              <th>CR Status</th> {/* New column */}
            </tr>
          </thead>
          <tbody>
            {allStates.map(({ requestId, quotationStatus, jobStatus, CRstatus }) => (
              <tr key={requestId}>
                <td className="mono">{requestId}</td>
                <td>{quotationStatus || '—'}</td>
                <td>{jobStatus || '—'}</td>
                <td>{CRstatus || '—'}</td> {/* Display CRstatus */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DecisionProjectionUI;

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
    const updatedData = rebuildProjection();
    setAllStates(updatedData);
    setLastRebuildTime(new Date());
  };

  const handleEmptyProjection = () => {
    console.log('[DecisionProjectionUI] Empty Projection button clicked - resetting projection');
    ChangeRequestDecisionTreeProjection.reset();
    setAllStates(ChangeRequestDecisionTreeProjection.getAll());
    setLastRebuildTime(null);
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
          <span
            className="rebuild-timestamp"
            style={{
              marginLeft: '1rem',
              fontSize: '0.9rem',
              color: '#666',
              fontStyle: 'italic'
            }}
          >
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
              <th>CR Status</th>
            </tr>
          </thead>
          <tbody>
            {allStates.map(({ requestId, quotationStatus, jobStatus, CRstatus }) => (
              <tr key={requestId}>
                <td className="mono">{requestId}</td>
                <td>{quotationStatus || '—'}</td>
                <td>{jobStatus || '—'}</td>
                <td>{CRstatus || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DecisionProjectionUI;

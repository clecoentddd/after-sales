import React, { useEffect, useState } from 'react';
import { ChangeRequestDecisionTreeProjection } from './projection';
import { rebuildProjection } from './rebuildProjection';
import './decisionProjection.css';

function DecisionProjectionUI() {
  const [allStates, setAllStates] = useState([]);

  useEffect(() => {
    const unsubscribe = ChangeRequestDecisionTreeProjection.subscribe((data) => {
      console.log('[DecisionProjectionUI] Projection updated:', data);
      setAllStates(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRefresh = () => {
    console.log('[DecisionProjectionUI] Refresh button clicked - rebuilding projection');
    rebuildProjection();
  };

  return (
    <div className="projection-block">
      <h3>
        Request Status Projection (Quotation + Job)
        <button 
          onClick={handleRefresh} 
          style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
          title="Rebuild projection from all events"
        >
          Refresh
        </button>
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
            </tr>
          </thead>
          <tbody>
            {allStates.map(({ requestId, quotationStatus, jobStatus }) => (
              <tr key={requestId}>
                <td className="mono">{requestId}</td>
                <td>{quotationStatus || '—'}</td>
                <td>{jobStatus || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DecisionProjectionUI;

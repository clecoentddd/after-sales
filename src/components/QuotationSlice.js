import React, { useState, useEffect } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { quotationApprovalCommandHandler } from '../domain/features/00_QuotationManagement/09_ApproveQuotation/commandHandler';
import { ApproveQuotationCommand } from '../domain/features/00_QuotationManagement/09_ApproveQuotation/commands';
import { useQuotationProjection } from '../domain/features/00_QuotationManagement/shared/useQuotationProjection.js';
import { useQuotationEvents } from '../domain/features/00_QuotationManagement/quotationManagementStream';
import { rebuildQuotationProjection } from '../domain/features/00_QuotationManagement/shared/rebuildQuotationProjection';
const OriginalApproveQuotationCommand = ApproveQuotationCommand;

const ApproveQuotationCommandWithLog = function(...args) {
  console.log('[QuotationSlice] Creating ApproveQuotationCommand with args:', args);
  return new OriginalApproveQuotationCommand(...args);
};

function QuotationSlice({ customers, requests, currentUserId }) {
  console.log('[QuotationSlice] Rendering QuotationSlice component');

  const { quotations: projectedQuotations } = useQuotationProjection();
  const [quotations, setQuotations] = useState([]);

  const { quotationEvents } = useQuotationEvents();
    // Sync local state with projection data
    useEffect(() => {
      setQuotations(projectedQuotations);
    }, [projectedQuotations]);

    const handleRebuild = async () => {
      console.log('[QuotationSlice] Rebuild button clicked');
      setQuotations([]); // Clear the customers array immediately
  
      // Wait for a short period to show the empty state
      await new Promise(resolve => setTimeout(resolve, 500));
  
      // Rebuild the projection
      const rebuiltQuotations = await rebuildQuotationProjection();
      setQuotations(rebuiltQuotations);
    };

  // Log whenever quotations change
  React.useEffect(() => {
    console.log('[QuotationSlice] quotations updated:', quotations);
  }, [quotations]);

  // Log whenever events change
  React.useEffect(() => {
    console.log('[QuotationSlice] quotationEvents updated:', quotationEvents);
  }, [quotationEvents]);

  const handleApproveQuotation = (quotationId) => {
    console.log('[QuotationSlice] Attempting to approve quotation:', quotationId);
    if (!quotationId) return;

    const currentQuotation = quotations.find(q => q.quotationId === quotationId);
    if (currentQuotation && currentQuotation.status === 'Approved') {
      console.warn(`Quotation ${quotationId} is already approved.`);
      return;
    }
    if (currentQuotation && currentQuotation.status === 'OnHold') {
      console.warn(`Quotation ${quotationId} is on hold and cannot be approved directly. Resolve hold first.`);
      return;
    }

    quotationApprovalCommandHandler.handle(
      ApproveQuotationCommandWithLog({
        quotationId,
        userId: currentUserId
      })
    );
  };

  return (
    <div className="aggregate-block">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Quotation Management</h2>
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
          <h3>Actions</h3>
          {quotations.length === 0 ? (
            <p>Create a Request to generate a Quotation.</p>
          ) : (
            <ul className="action-list">
              {quotations.map(quotation => (
                <li key={quotation.quotationId}>
                  <button
                    onClick={() => handleApproveQuotation(quotation.quotationId)}
                    disabled={quotation.status === 'Approved' || quotation.status === 'OnHold'}
                    className={quotation.status === 'Approved' ? 'approved-button' : ''}
                  >
                    {quotation.status === 'Approved' ? 'Approved' : 'Approve Quotation'}
                  </button>
                  <div>
                    <small>Quotation ID: {quotation.quotationId}</small>
                  </div>
                  <div>
                    <small>Status: {quotation.status}</small>
                  </div>
                  <small>{quotation.quotationDetails?.title?.slice(0, 80)}...</small>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="aggregate-column second-column">
          <ReadModelDisplay
            items={quotations}
            idKey="quotationId"
            renderDetails={(quotation) => {
              console.log('[QuotationSlice] Rendering details for quotation:', quotation);
              console.log('[QuotationSlice] Customers projection:', customers);

              const customer = customers.find(c => c.customerId === quotation.customerId);
              console.log('[QuotationSlice] Matched customer:', customer);
              const request = requests.find(r => r.requestId === quotation.requestId);
              console.log('[QuotationSlice] Matched request:', request);
              return (
                <>
                  <strong>{quotation.quotationDetails?.title}</strong>
                  <small>
                    For: {customer?.name || 'Unknown Customer'} <br />
                    Amount: {quotation.estimatedAmount} {quotation.quotationDetails?.currency} <br />
                    Status: {quotation.status}
                    {quotation.status === 'OnHold' && ` (Reason: ${quotation.onHoldReason || 'N/A'})`}
                  </small>
                </>
              );
            }}
          />
        </div>
        <div className="aggregate-column third-column">
          <EventLogDisplay events={quotationEvents} />
        </div>
      </div>
    </div>
  );
}

export default QuotationSlice;

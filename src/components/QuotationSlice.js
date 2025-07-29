import React, { useState } from 'react'; // Keep useState for other potential uses if needed, otherwise remove
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { quotationApprovalCommandHandler } from '../domain/features/09_ApproveQuotation/commandHandler';
import { ApproveQuotationCommand } from '../domain/features/09_ApproveQuotation/commands';


const OriginalApproveQuotationCommand = ApproveQuotationCommand;
const ApproveQuotationCommandWithLog = function(...args) {
  console.log('[QuotationSlice] Creating ApproveQuotationCommand with args:', args);
  return new OriginalApproveQuotationCommand(...args);
};

function QuotationSlice({ quotations, quotationEvents, approvedQuotations, customers, requests, currentUserId }) {
 
  const handleApproveQuotation = (quotationId) => {
    console.log('[QuotationSlice] Attempting to approve quotation:', quotationId);
    if (!quotationId) return;

    // Check current status from the 'quotations' read model
    const currentQuotation = quotations.find(q => q.quotationId === quotationId);
    if (currentQuotation && currentQuotation.status === 'Approved') {
      console.warn(`Quotation ${quotationId} is already approved.`);
      return;
    }
    // Also prevent approval if it's on hold
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

  // Removed: handlePutQuotationOnHold function and its related logic

 return (
  <div className="aggregate-block">
    <h2>Quotation Management</h2>
    <div className="aggregate-columns">
      
      <div className="aggregate-column first-column">
        <h3>Actions</h3>
        {quotations.length === 0 ? (
          <p>Create a Request to generate a Quotation.</p>
        ) : (
          <ul className="action-list">
            {quotations.map(quotation => (
              console.log(`[QuotationSlice] Mapping: Button for quotationId: ${quotation.quotationId}`),
              <li key={quotation.quotationId}>
                {console.log('Rendering button for quotationId:', quotation.quotationId)} 
                <button 
                  onClick={() => handleApproveQuotation(quotation.quotationId)}
                  disabled={quotation.status === 'Approved' || quotation.status === 'OnHold'}
                  className={quotation.status === 'Approved' ? 'approved-button' : ''}
                >
                  {quotation.status === 'Approved' ? 'Approved' : 'Approve Quotation'}
                </button>
                <small>{quotation.quotationDetails.title.slice(0, 80)}...</small>
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
            const customer = customers.find(c => c.customerId === quotation.customerId);
            const request = requests.find(r => r.requestId === quotation.requestId);
            return (
              <>
                <strong>{quotation.quotationDetails.title}</strong>
                <small>
                  For: {customer?.name || 'Unknown Customer'} <br />
                  Related Request: {request?.requestDetails.title.slice(0, 20)}... <br />
                  Amount: {quotation.quotationDetails.estimatedAmount} {quotation.quotationDetails.currency} <br />
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

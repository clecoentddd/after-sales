import React, { useState } from 'react'; // Keep useState for other potential uses if needed, otherwise remove
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { quoteApprovalCommandHandler } from '../domain/features/09_ApproveQuote/commandHandler';
import { ApproveQuoteCommand } from '../domain/features/09_ApproveQuote/commands';

function QuotationSlice({ quotations, quotationEvents, approvedQuotes, customers, requests, currentUserId }) {
 
  const handleApproveQuote = (quoteId) => {
    if (!quoteId) return;

    // Check current status from the 'quotations' read model
    const currentQuote = quotations.find(q => q.quoteId === quoteId);
    if (currentQuote && currentQuote.status === 'Approved') {
      console.warn(`Quote ${quoteId} is already approved.`);
      return;
    }
    // Also prevent approval if it's on hold
    if (currentQuote && currentQuote.status === 'On Hold') {
      console.warn(`Quote ${quoteId} is on hold and cannot be approved directly. Resolve hold first.`);
      return;
    }

    quoteApprovalCommandHandler.handle(
      new ApproveQuoteCommand({
    quoteId,
    userId: currentUserId
  })
);
  };

  // Removed: handlePutQuotationOnHold function and its related logic

 return (
  <div className="aggregate-block">
    <h2>Quotation Aggregate</h2>
    <div className="aggregate-columns">
      
      <div className="aggregate-column first-column">
        <h3>Actions</h3>
        {quotations.length === 0 ? (
          <p>Create a Request to generate a Quote.</p>
        ) : (
          <ul className="action-list">
            {quotations.map(quote => (
              <li key={quote.quoteId}>
                <button 
                  onClick={() => handleApproveQuote(quote.quoteId)}
                  disabled={quote.status === 'Approved' || quote.status === 'On Hold'}
                  className={quote.status === 'Approved' ? 'approved-button' : ''}
                >
                  {quote.status === 'Approved' ? 'Approved' : 'Approve Quote'}
                </button>
                <small>{quote.quotationDetails.title.slice(0, 30)}...</small>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="aggregate-column second-column">
        <ReadModelDisplay
          items={quotations}
          idKey="quoteId"
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
                  {quotation.status === 'On Hold' && ` (Reason: ${quotation.onHoldReason || 'N/A'})`}
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

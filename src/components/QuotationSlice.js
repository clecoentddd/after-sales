import React from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { quoteApprovalCommandHandler } from '../domain/features/approval/commandHandler';
import { ApproveQuoteCommand } from '../domain/features/approval/commands';

function QuotationSlice({ quotations, quotationEvents, approvedQuotes, customers, requests, currentUserId }) {
  const handleApproveQuote = (quoteId) => {
    if (!quoteId) return;

    const isAlreadyApproved = approvedQuotes.some(approval => approval.quoteId === quoteId);
    if (isAlreadyApproved) {
      console.warn(`Quote ${quoteId} is already approved.`);
      return;
    }

    quoteApprovalCommandHandler.handle(
      ApproveQuoteCommand(
        quoteId,
        currentUserId 
      )
    );
  };

  return (
    <div className="aggregate-block">
      <h2>Quotation Aggregate</h2>
      <div className="aggregate-columns">
        <div className="aggregate-column"> 
          <h3>Actions</h3>
          {quotations.length === 0 ? (
            <p>Create a Request to generate a Quote.</p>
          ) : (
            <ul className="action-list">
              {quotations.map(quote => (
                <li key={quote.quotationId}>
                  <button 
                    onClick={() => handleApproveQuote(quote.quotationId)}
                    disabled={approvedQuotes.some(app => app.quoteId === quote.quotationId) || quote.status === 'Approved'}
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
                </small>
              </>
            );
          }}
        />
        <EventLogDisplay events={quotationEvents} />
      </div>
    </div>
  );
}

export default QuotationSlice;

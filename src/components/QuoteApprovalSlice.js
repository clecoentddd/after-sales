import React from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';

function QuoteApprovalSlice({ approvedQuotes, approvalEvents, quotations, customers }) {
return (
  <div className="aggregate-block">
    <h2>Quote Approval Aggregate</h2>
    <div className="aggregate-columns">

      <div className="aggregate-column first-column">
        <h3>Approved Quote (via Quote Actions)</h3>
        <p>Approve quotes by clicking the 'Approve Quote' button in the Quotation block above.</p>
      </div>

      <div className="aggregate-column second-column">
        <ReadModelDisplay
          items={approvedQuotes}
          idKey="quoteId"
          renderDetails={(approval) => {
            const approvedQuotation = quotations.find(q => q.quotationId === approval.quoteId);
            const customer = approvedQuotation ? customers.find(c => c.customerId === approvedQuotation.customerId) : null;
            return (
              <>
                <strong>Quote Approved: {approvedQuotation?.quotationDetails.title.slice(0, 40)}...</strong>
                <small>
                  Quote ID: {approval.quoteId.slice(0, 8)}... <br />
                  Approved by: {approval.approvedByUserId} <br />
                  For: {customer?.name || 'Unknown Customer'}
                </small>
              </>
            );
          }}
        />
      </div>

      <div className="aggregate-column third-column">
        <EventLogDisplay events={approvalEvents} />
      </div>

    </div>
  </div>
);

}

export default QuoteApprovalSlice;

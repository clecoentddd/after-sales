import React from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';

function QuotationApprovalSlice({ approvedQuotations, approvalEvents, quotations, customers }) {
return (
  <div className="aggregate-block">
    <h2>Quotation Approval Aggregate</h2>
    <div className="aggregate-columns">

      <div className="aggregate-column first-column">
        <h3>Approved Quotation (via Quotation Actions)</h3>
        <p>Approve quotations by clicking the 'Approve Quotation' button in the Quotation block above.</p>
      </div>

      <div className="aggregate-column second-column">
        <ReadModelDisplay
          items={approvedQuotations}
          idKey="quotationId"
          renderDetails={(approval) => {
            const approvedQuotation = quotations.find(q => q.quotationId === approval.quotationId);
            const customer = approvedQuotation ? customers.find(c => c.customerId === approvedQuotation.customerId) : null;
            return (
              <>
                <strong>Quotation Approved: {approvedQuotation?.quotationDetails.title.slice(0, 40)}...</strong>
                <small>
                  Quotation ID: {approval.quotationId}... <br />
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

export default QuotationApprovalSlice;

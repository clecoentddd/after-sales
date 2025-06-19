import React from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';

function InvoicingSlice({ invoices, invoiceEvents, customers, jobs }) {
  return (
    <div className="aggregate-block">
      <h2>Invoicing Aggregate</h2>
      <div className="aggregate-columns">
        <div className="aggregate-column">
            <h3>Process Trigger</h3>
            <p>Invoices are automatically created when a Job is Completed.</p>
        </div>
        <ReadModelDisplay
          items={invoices}
          idKey="invoiceId"
          renderDetails={(invoice) => {
            const customer = customers.find(c => c.customerId === invoice.customerId);
            const relatedJob = jobs.find(j => j.jobId === invoice.jobId);
            return (
              <>
                <strong>Invoice for: {invoice.description}</strong>
                <small>
                  Customer: {customer?.name || 'Unknown'} <br />
                  Job: {relatedJob?.jobDetails.title.slice(0, 20)}... <br />
                  Amount: {invoice.amount} {invoice.currency} <br />
                  Status: {invoice.status}
                </small>
              </>
            );
          }}
        />
        <EventLogDisplay events={invoiceEvents} />
      </div>
    </div>
  );
}

export default InvoicingSlice;

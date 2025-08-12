import React from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';

function InvoicingSlice({ invoices, invoiceEvents, customers, jobs }) {
  return (
  <div className="aggregate-block">
    <h2>Invoicing Management</h2>
    <div className="aggregate-columns">

      <div className="aggregate-column first-column">
        <h3>Invoices Created</h3>
        <p>Invoices are automatically created when a Job is Completed.</p>
      </div>

<div className="aggregate-column second-column">
  <ReadModelDisplay
    items={invoices}
    idKey="invoiceId"
    renderDetails={(invoice) => {
      try {
        console.log('Rendering invoice:', invoice);

        // Handle undefined customerId
        const customer = invoice.customerId
          ? customers.find(c => c.customerId === invoice.customerId)
          : null;
        console.log('Found customer:', customer);
        const customerName = customer ? customer.name : 'Unknown Customer';

        // Handle undefined jobId
        const relatedJob = invoice.jobId
          ? jobs.find(j => j.jobId === invoice.jobId)
          : null;
        console.log('Found related job:', relatedJob);

        // Handle case where relatedJob is null or undefined
        if (!relatedJob) {
          console.warn('No related job found for invoice:', invoice);
          return (
            <>
              <strong>Invoice for: {JSON.stringify(invoice.description)}</strong>
              <small>
                Customer: {customerName} <br />
                Job: Unknown <br />
                Amount: {invoice.amount} {invoice.currency} <br />
                Status: {invoice.status}
              </small>
            </>
          );
        }

        if (!relatedJob.jobDetails) {
          console.warn('No job details found for related job:', relatedJob);
          return (
            <>
              <strong>Invoice for: {JSON.stringify(invoice.description)}</strong>
              <small>
                Customer: {customerName} <br />
                Job: No details available <br />
                Amount: {invoice.amount} {invoice.currency} <br />
                Status: {invoice.status}
              </small>
            </>
          );
        }

        // Ensure jobDetails.title is a string
        const jobTitle = typeof relatedJob.jobDetails.title === 'string'
          ? relatedJob.jobDetails.title.slice(0, 20)
          : 'Invalid title';

        return (
          <>
            <strong>{jobTitle}... </strong>
            <small>
              Customer: {customerName} <br />
              {jobTitle}... <br />
              Amount: {invoice.amount} {invoice.currency} <br />
              Status: {invoice.status} <br />
              Operations: {JSON.stringify(invoice.description)}
            </small>
          </>
        );
      } catch (error) {
        console.error('Error rendering invoice details:', error);
        return (
          <>
            <strong>Error loading invoice details</strong>
          </>
        );
      }
    }}
  />
</div>



      <div className="aggregate-column third-column">
        <EventLogDisplay events={invoiceEvents} />
      </div>

    </div>
  </div>
);

}

export default InvoicingSlice;

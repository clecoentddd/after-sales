import { useEffect, useState } from 'react';
import { eventBus } from './domain/core/eventBus';
import { 
  organizationEventStore, 
  customerEventStore, 
  requestEventStore, 
  quotationEventStore, 
  quoteApprovalEventStore,
  jobCreationEventStore,
  startJobEventStore,
  jobCompletionEventStore,
  invoiceEventStore,
  changeRequestEventStore,
  onHoldJobEventStore 
} from './domain/core/eventStore'; 
import { initializeQuotationEventHandler } from './domain/features/quotation/eventHandler';
import { initializeCreateJobEventHandler } from './domain/features/createJob/eventHandler';
import { initializeCompleteJobEventHandler } from './domain/features/completeJob/eventHandler';
import { initializeChangeRequestEventHandler } from './domain/features/changeRequested/eventHandler'; // New: Import change request event handler

// Import UI slice components
import OrganizationSlice from './components/OrganizationSlice';
import CustomerSlice from './components/CustomerSlice';
import RequestSlice from './components/RequestSlice';
import QuotationSlice from './components/QuotationSlice';
import QuoteApprovalSlice from './components/QuoteApprovalSlice';
import RepairJobSlice from './components/RepairJobSlice';
import InvoicingSlice from './components/InvoicingSlice';
import ChangeRequestSlice from './components/ChangeRequestSlice'; 

import './App.css';

function App() {
  // Global Read Model States
  const [organizations, setOrganizations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [approvedQuotes, setApprovedQuotes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]); 

  // Event Log States (for display in EventLogDisplay component)
  const [orgEvents, setOrgEvents] = useState([]);
  const [customerEvents, setCustomerEvents] = useState([]);
  const [requestEvents, setRequestEvents] = useState([]);
  const [quotationEvents, setQuotationEvents] = useState([]);
  const [approvalEvents, setApprovalEvents] = useState([]);
  const [jobEvents, setJobEvents] = useState([]);
  const [invoiceEvents, setInvoiceEvents] = useState([]);
  const [changeRequestEvents, setChangeRequestEvents] = useState([]); 

  const currentUserId = 'user-alice-123'; 

  // Load initial state for all aggregates on component mount
  useEffect(() => {
    // Organizations
    const orgEventsLoaded = organizationEventStore.getEvents();
    setOrganizations(
      orgEventsLoaded.filter(e => e.type === 'OrganizationCreated').map(e => e.data)
    );
    setOrgEvents(orgEventsLoaded);

    // Customers
    const customerEventsLoaded = customerEventStore.getEvents();
    setCustomers(
      customerEventsLoaded.filter(e => e.type === 'CustomerCreated').map(e => e.data)
    );
    setCustomerEvents(customerEventsLoaded);

    // Requests
    const requestEventsLoaded = requestEventStore.getEvents();
    setRequests(
      requestEventsLoaded.filter(e => e.type === 'RequestCreated').map(e => e.data)
    );
    setRequestEvents(requestEventsLoaded);

    // Quotations
    const quotationEventsLoaded = quotationEventStore.getEvents();
    setQuotations(
      quotationEventsLoaded.filter(e => e.type === 'QuotationCreated').map(e => e.data)
    );
    setQuotationEvents(quotationEventsLoaded);

    // Quote Approvals
    const approvalEventsLoaded = quoteApprovalEventStore.getEvents();
    setApprovedQuotes(
      approvalEventsLoaded.filter(e => e.type === 'QuoteApproved').map(e => e.data)
    );
    setApprovalEvents(approvalEventsLoaded);

    // Repair Jobs - Load initial jobs from event stores and reconstruct state
    const jobCreatedEventsLoaded = jobCreationEventStore.getEvents(); 
    const jobStartedEventsLoaded = startJobEventStore.getEvents(); 
    const jobCompletedEventsLoaded = jobCompletionEventStore.getEvents();
    const jobOnHoldEventsLoaded = onHoldJobEventStore.getEvents(); 
    
    const allJobEventsCombined = [
      ...jobCreatedEventsLoaded, 
      ...jobStartedEventsLoaded,
      ...jobCompletedEventsLoaded,
      ...jobOnHoldEventsLoaded 
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); 

    let reconstructedJobs = jobCreatedEventsLoaded
      .filter(e => e.type === 'JobCreated')
      .map(e => ({ ...e.data })); 

    allJobEventsCombined.forEach(event => { 
      if (event.type === 'JobStarted') {
        reconstructedJobs = reconstructedJobs.map(job => {
          if (job.jobId === event.data.jobId) {
            return {
              ...job,
              status: 'Started', 
              jobDetails: { 
                ...job.jobDetails,
                assignedTeam: event.data.assignedTeam
              }
            };
          }
          return job;
        });
      } else if (event.type === 'JobCompleted') { 
        reconstructedJobs = reconstructedJobs.map(job => {
          if (job.jobId === event.data.jobId) {
            return {
              ...job,
              status: 'Completed',
              completionDetails: event.data.completionDetails 
            };
          }
          return job;
        });
      } else if (event.type === 'JobOnHold') { 
        reconstructedJobs = reconstructedJobs.map(job => {
          if (job.jobId === event.data.jobId) {
            return {
              ...job,
              status: 'On Hold',
              onHoldReason: event.data.reason 
            };
          }
          return job;
        });
      }
    });

    setJobs(reconstructedJobs);
    setJobEvents(allJobEventsCombined);

    // Invoices
    const invoiceEventsLoaded = invoiceEventStore.getEvents();
    setInvoices(
      invoiceEventsLoaded.filter(e => e.type === 'InvoiceCreated').map(e => e.data)
    );
    setInvoiceEvents(invoiceEventsLoaded);

    // Change Requests
    const changeRequestEventsLoaded = changeRequestEventStore.getEvents();
    setChangeRequests(
      changeRequestEventsLoaded.filter(e => e.type === 'ChangeRequestRaised').map(e => e.data)
    );
    setChangeRequestEvents(changeRequestEventsLoaded);

    // Initialize all relevant event handlers
    initializeQuotationEventHandler();
    initializeCreateJobEventHandler(); 
    initializeCompleteJobEventHandler();
    initializeChangeRequestEventHandler(); 
  }, []);

  // Subscribe to events for all aggregates (update global read models)
  useEffect(() => {
    const unsubOrg = eventBus.subscribe('OrganizationCreated', (event) => {
      setOrganizations(prev => [...prev, event.data]);
      setOrgEvents(prev => [...prev, event]);
    });

    const unsubCustomer = eventBus.subscribe('CustomerCreated', (event) => {
      setCustomers(prev => [...prev, event.data]);
      setCustomerEvents(prev => [...prev, event]);
    });

    const unsubRequest = eventBus.subscribe('RequestCreated', (event) => {
      setRequests(prev => [...prev, event.data]);
      setRequestEvents(prev => [...prev, event]);
    });

    const unsubQuotation = eventBus.subscribe('QuotationCreated', (event) => {
      setQuotations(prev => [...prev, event.data]);
      setQuotationEvents(prev => [...prev, event]);
    });

    const unsubApproval = eventBus.subscribe('QuoteApproved', (event) => {
      setApprovedQuotes(prev => [...prev, event.data]);
      setApprovalEvents(prev => [...prev, event]);
      setQuotations(prev => prev.map(q => 
        q.quotationId === event.data.quoteId ? { ...q, status: 'Approved' } : q
      ));
    });

    const unsubJobCreated = eventBus.subscribe('JobCreated', (event) => {
      setJobs(prev => {
        if (!prev.some(job => job.jobId === event.data.jobId)) {
          return [...prev, event.data];
        }
        return prev;
      });
      setJobEvents(prev => [...prev, event]); 
    });

    const unsubJobStarted = eventBus.subscribe('JobStarted', (event) => {
      setJobEvents(prev => [...prev, event]); 
      setJobs(prev => prev.map(job => 
        job.jobId === event.data.jobId ? { 
          ...job, 
          status: 'Started', 
          jobDetails: { 
            ...job.jobDetails,
            assignedTeam: event.data.assignedTeam
          }
        } : job
      ));
    });

    const unsubJobCompleted = eventBus.subscribe('JobCompleted', (event) => {
      setJobEvents(prev => [...prev, event]);
      setJobs(prev => prev.map(job =>
        job.jobId === event.data.jobId ? {
          ...job,
          status: 'Completed', 
          completionDetails: event.data.completionDetails 
        } : job
      ));
    });

    const unsubInvoiceCreated = eventBus.subscribe('InvoiceCreated', (event) => {
      setInvoices(prev => [...prev, event.data]);
      setInvoiceEvents(prev => [...prev, event]);
    });

    const unsubChangeRequestRaised = eventBus.subscribe('ChangeRequestRaised', (event) => {
      setChangeRequests(prev => [...prev, event.data]);
      setChangeRequestEvents(prev => [...prev, event]);
    });

    const unsubJobOnHold = eventBus.subscribe('JobOnHold', (event) => {
      setJobEvents(prev => [...prev, event]); 
      setJobs(prev => prev.map(job =>
        job.jobId === event.data.jobId ? {
          ...job,
          status: 'On Hold', 
          onHoldReason: event.data.reason 
        } : job
      ));
    });


    return () => {
      unsubOrg();
      unsubCustomer();
      unsubRequest();
      unsubQuotation();
      unsubApproval();
      unsubJobCreated();
      unsubJobStarted(); 
      unsubJobCompleted();
      unsubInvoiceCreated();
      unsubChangeRequestRaised();
      unsubJobOnHold(); 
    };
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Event Sourcing Demo</h1>
      </header>

      <div className="aggregate-blocks">
        <OrganizationSlice 
          organizations={organizations} 
          orgEvents={orgEvents} 
        />
        <CustomerSlice 
          customers={customers} 
          customerEvents={customerEvents} 
          organizations={organizations} 
        />
        <RequestSlice 
          requests={requests} 
          requestEvents={requestEvents} 
          customers={customers} 
        />
        <QuotationSlice 
          quotations={quotations} 
          quotationEvents={quotationEvents} 
          approvedQuotes={approvedQuotes} 
          customers={customers} 
          requests={requests} 
          currentUserId={currentUserId} 
        />
        <QuoteApprovalSlice 
          approvedQuotes={approvedQuotes} 
          approvalEvents={approvalEvents} 
          quotations={quotations} 
          customers={customers} 
        />
        <RepairJobSlice 
          jobs={jobs} 
          jobEvents={jobEvents} 
          customers={customers} 
          requests={requests} 
          quotations={quotations} 
          currentUserId={currentUserId} 
        />
        <InvoicingSlice 
          invoices={invoices} 
          invoiceEvents={invoiceEvents} 
          customers={customers} 
          jobs={jobs} 
        />
        <ChangeRequestSlice
          changeRequests={changeRequests}
          changeRequestEvents={changeRequestEvents}
          requests={requests} 
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}

export default App;

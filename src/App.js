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
  onHoldJobEventStore,
  onHoldQuotationEventStore // Import the on-hold quotation event store
} from './domain/core/eventStore'; 
import { initializeQuotationEventHandler } from './domain/features/quotation/eventHandler';
import { initializeCreateJobEventHandler } from './domain/features/createJob/eventHandler';
import { initializeCompleteJobEventHandler } from './domain/features/completeJob/eventHandler';
import { initializeChangeRequestEventHandler } from './domain/features/changeRequested/eventHandler'; 

// Import UI slice components
import OrganizationSlice from './components/OrganizationSlice';
import CustomerSlice from './components/CustomerSlice';
import RequestSlice from './components/RequestSlice';
import QuotationSlice from './components/QuotationSlice';
import QuoteApprovalSlice from './components/QuoteApprovalSlice';
import RepairJobSlice from './components/RepairJobSlice';
import InvoicingSlice from './components/InvoicingSlice';
import ChangeRequestSlice from './components/ChangeRequestSlice'; 
import QuotationSubscriberToChangeRequest from './components/QuotationSubscriberToChangeRequest';
// NEW: Import QuotationApprovalMonitor
import QuotationApprovalMonitor from './components/QuotationApprovalMonitor'; 


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

    // Quotations - Reconstruct state including 'On Hold' events
    const quotationCreatedEvents = quotationEventStore.getEvents().filter(e => e.type === 'QuotationCreated');
    const quotationApprovedEvents = quoteApprovalEventStore.getEvents().filter(e => e.type === 'QuoteApproved');
    const quotationOnHoldEvents = onHoldQuotationEventStore.getEvents().filter(e => e.type === 'QuotationOnHold'); 

    const allQuotationEventsCombined = [
      ...quotationCreatedEvents,
      ...quotationApprovedEvents,
      ...quotationOnHoldEvents 
    ].sort((a, b) => new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime());

    let reconstructedQuotationsMap = new Map();

    allQuotationEventsCombined.forEach(event => {
      const quotationId = event.data.quotationId || event.data.quoteId;

      let currentQuotation = reconstructedQuotationsMap.get(quotationId) || { quotationId: quotationId };

      if (event.type === 'QuotationCreated') {
        const existingStatus = currentQuotation.status;
        currentQuotation = { ...currentQuotation, ...event.data, status: event.data.status || 'Draft' };
        if (existingStatus && existingStatus !== 'Draft' && existingStatus !== 'Pending') {
          currentQuotation.status = existingStatus; 
        }
      } else if (event.type === 'QuoteApproved') {
        currentQuotation.status = 'Approved';
      } else if (event.type === 'QuotationOnHold') { 
        currentQuotation.status = 'On Hold';
        currentQuotation.onHoldReason = event.data.reason;
        currentQuotation.requestId = event.data.requestId; 
        currentQuotation.changeRequestId = event.data.changeRequestId;
      }
      reconstructedQuotationsMap.set(quotationId, currentQuotation);
    });

    setQuotations(Array.from(reconstructedQuotationsMap.values()));
    setQuotationEvents(allQuotationEventsCombined); 

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
      setQuotations(prev => {
        const newQuotations = [...prev];
        const existingIndex = newQuotations.findIndex(q => q.quotationId === event.data.quotationId);
        
        const quotationData = { 
            quotationId: event.data.quotationId,
            requestId: event.data.requestId,
            customerId: event.data.customerId,
            quotationDetails: event.data.quotationDetails,
            status: event.data.status || 'Draft'
        };

        if (existingIndex > -1) {
          const updatedQuotation = { 
            ...newQuotations[existingIndex], 
            ...quotationData, 
            status: (newQuotations[existingIndex].status && newQuotations[existingIndex].status !== 'Draft' && newQuotations[existingIndex].status !== 'Pending') 
                      ? newQuotations[existingIndex].status 
                      : quotationData.status 
          };
          newQuotations[existingIndex] = updatedQuotation;
        } else {
          newQuotations.push(quotationData);
        }
        return newQuotations;
      });
      setQuotationEvents(prev => [...prev, event]);
    });

    const unsubApproval = eventBus.subscribe('QuoteApproved', (event) => {
      setApprovedQuotes(prev => [...prev, event.data]);
      setApprovalEvents(prev => [...prev, event]);
      setQuotations(prev => prev.map(q => 
        q.quotationId === event.data.quoteId ? { ...q, status: 'Approved' } : q
      ));
    });

    // Subscribe to QuotationOnHold event for real-time updates
    const unsubQuotationOnHold = eventBus.subscribe('QuotationOnHold', (event) => {
      setQuotationEvents(prev => [...prev, event]); 
      setQuotations(prev => {
        const newQuotations = [...prev]; 
        const existingIndex = newQuotations.findIndex(q => q.quotationId === event.data.quotationId);

        const onHoldData = {
          quotationId: event.data.quotationId,
          status: event.data.status, 
          onHoldReason: event.data.reason,
          requestId: event.data.requestId || null, 
          changeRequestId: event.data.changeRequestId || null
        };

        if (existingIndex > -1) {
          newQuotations[existingIndex] = { 
            ...newQuotations[existingIndex], 
            ...onHoldData
          };
        } else {
          const placeholderQuotation = {
              customerId: null, 
              quotationDetails: {}, 
              ...onHoldData
          };
          newQuotations.push(placeholderQuotation);
        }
        return newQuotations;
      });
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
      unsubQuotationOnHold();
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
        {/* Component to subscribe to ChangeRequestRaised events and log them */}
        <QuotationSubscriberToChangeRequest />
        {/* NEW: Component to monitor QuotationCreated events and automatically put on hold */}
        <QuotationApprovalMonitor 
          currentUserId={currentUserId} 
          quotations={quotations} // Pass quotations read model
        />
      </div>
    </div>
  );
}

export default App;

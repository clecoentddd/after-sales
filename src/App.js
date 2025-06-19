import { useEffect, useState } from 'react';
import { eventBus } from './domain/core/eventBus';
import { 
  organizationEventStore, 
  customerEventStore, 
  requestEventStore, 
  quotationEventStore, 
  quoteApprovalEventStore,
  jobCreationEventStore, // Import for JobCreatedEvent
  startJobEventStore    // Import for JobStartedEvent
} from './domain/core/eventStore'; 
import { organizationCommandHandler } from './domain/features/organization/commandHandler';
import { customerCommandHandler } from './domain/features/customer/commandHandler';
import { requestCommandHandler } from './domain/features/request/commandHandler';
import { CreateRequestCommand } from './domain/features/request/commands';
import { initializeQuotationEventHandler } from './domain/features/quotation/eventHandler';
import { quoteApprovalCommandHandler } from './domain/features/approval/commandHandler';
import { ApproveQuoteCommand } from './domain/features/approval/commands';
import { initializeCreateJobEventHandler } from './domain/features/createJob/eventHandler'; // Initialize the create job event handler
import { startJobCommandHandler } from './domain/features/startJob/commandHandler'; // Import startJobCommandHandler
import { StartJobCommand } from './domain/features/startJob/commands'; // Import StartJobCommand

import ReadModelDisplay from './components/ReadModelDisplay';
import EventLogDisplay from './components/EventLogDisplay';
import './App.css';

function App() {
  // State for Organization and Customer (existing)
  const [organizations, setOrganizations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orgName, setOrgName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [orgEvents, setOrgEvents] = useState([]);
  const [customerEvents, setCustomerEvents] = useState([]);

  // State for Request (existing)
  const [requests, setRequests] = useState([]);
  const [requestEvents, setRequestEvents] = useState([]);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // State for Quotation (existing)
  const [quotations, setQuotations] = useState([]);
  const [quotationEvents, setQuotationEvents] = useState([]);

  // State for Quote Approvals (existing)
  const [approvedQuotes, setApprovedQuotes] = useState([]);
  const [approvalEvents, setApprovalEvents] = useState([]);
  const currentUserId = 'user-alice-123'; 

  // State for Repair Jobs (existing)
  const [jobs, setJobs] = useState([]); // State to hold repair job read model data
  const [jobEvents, setJobEvents] = useState([]); // State to hold raw repair job events

  // State for selected team for job start
  const [selectedTeam, setSelectedTeam] = useState('Team_A'); // Default team

  // Load initial state for all aggregates
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
    const jobCreatedEventsLoaded = jobCreationEventStore.getEvents(); // Get JobCreated events
    const jobStartedEventsLoaded = startJobEventStore.getEvents(); // Get JobStarted events
    
    // Combine all relevant job events for display
    const allJobEventsCombined = [...jobCreatedEventsLoaded, ...jobStartedEventsLoaded]
                                   .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Sort by timestamp

    // Reconstruct job state: Start with created jobs, then apply any 'started' events
    let reconstructedJobs = jobCreatedEventsLoaded
      .filter(e => e.type === 'JobCreated')
      .map(e => ({ ...e.data })); // Shallow copy to avoid direct mutation

    jobStartedEventsLoaded.forEach(event => {
      if (event.type === 'JobStarted') {
        reconstructedJobs = reconstructedJobs.map(job => {
          if (job.jobId === event.data.jobId) {
            return {
              ...job,
              status: 'Started', // Update status
              jobDetails: { // Update jobDetails to include assigned team
                ...job.jobDetails,
                assignedTeam: event.data.assignedTeam
              }
            };
          }
          return job;
        });
      }
      // Add other job-related event types here (e.g., JobCompleted, JobCanceled)
    });

    setJobs(reconstructedJobs);
    setJobEvents(allJobEventsCombined); // Store all combined raw events

    // Initialize all relevant event handlers
    initializeQuotationEventHandler();
    initializeCreateJobEventHandler(); 
    // No specific initialize for startJob, as its handler is directly called by UI command
  }, []);

  // Subscribe to events for all aggregates
  useEffect(() => {
    const unsubOrg = eventBus.subscribe('OrganizationCreated', (event) => {
      setOrganizations(prev => [...prev, event.data]);
      setOrgEvents(prev => [...prev, event]);
    });

    const unsubCustomer = eventBus.subscribe('CustomerCreated', (event) => {
      setCustomers(prev => [...prev, event.data]);
      setCustomerEvents(prev => [...prev, event]);
    });

    // Subscribe to RequestCreated event (existing)
    const unsubRequest = eventBus.subscribe('RequestCreated', (event) => {
      setRequests(prev => [...prev, event.data]);
      setRequestEvents(prev => [...prev, event]);
    });

    // Subscribe to QuotationCreated event (existing)
    const unsubQuotation = eventBus.subscribe('QuotationCreated', (event) => {
      setQuotations(prev => [...prev, event.data]);
      setQuotationEvents(prev => [...prev, event]);
    });

    // Subscribe to QuoteApproved event (existing)
    const unsubApproval = eventBus.subscribe('QuoteApproved', (event) => {
      setApprovedQuotes(prev => [...prev, event.data]);
      setApprovalEvents(prev => [...prev, event]);
      // Update the status of the approved quotation in the 'quotations' read model
      setQuotations(prev => prev.map(q => 
        q.quotationId === event.data.quoteId ? { ...q, status: 'Approved' } : q
      ));
    });

    // Subscribe to JobCreated event (from createJob slice)
    const unsubJobCreated = eventBus.subscribe('JobCreated', (event) => {
      setJobs(prev => {
        // Ensure no duplicates if strict mode causes double-dispatch during init
        if (!prev.some(job => job.jobId === event.data.jobId)) {
          return [...prev, event.data];
        }
        return prev;
      });
      setJobEvents(prev => [...prev, event]); // Add raw event to combined list
    });

    // Subscribe to JobStarted event (from startJob slice)
    const unsubJobStarted = eventBus.subscribe('JobStarted', (event) => {
      setJobEvents(prev => [...prev, event]); // Add raw event to combined list
      // Update the status of the relevant job in the 'jobs' read model
      setJobs(prev => prev.map(job => 
        job.jobId === event.data.jobId ? { 
          ...job, 
          status: 'Started', // Change status to Started
          jobDetails: { // Update jobDetails to include assigned team
            ...job.jobDetails,
            assignedTeam: event.data.assignedTeam
          }
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
    };
  }, []);

  // Handler for creating Organization (existing)
  const handleCreateOrg = (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    
    organizationCommandHandler.handle({ 
      type: 'CreateOrganization', 
      name: orgName.trim() 
    });
    setOrgName('');
  };

  // Handler for creating Customer (existing)
  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!customerName.trim() || !selectedOrgId) return;
    
    customerCommandHandler.handle({
      type: 'CreateCustomer',
      name: customerName.trim(),
      organizationId: selectedOrgId
    });
    
    setCustomerName('');
    setSelectedOrgId('');
  };

  // Handler for creating Request (existing)
  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (!requestTitle.trim() || !selectedCustomerId) {
      console.warn("Please enter a request title and select a customer.");
      return;
    }
    
    requestCommandHandler.handle(
      CreateRequestCommand(
        selectedCustomerId,
        {
          title: requestTitle.trim(),
          description: requestDescription.trim(),
        }
      )
    );
    
    setRequestTitle('');
    setRequestDescription('');
    setSelectedCustomerId('');
  };

  // Handler for approving a Quote (existing)
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

  // Handler for starting a Job (new) - uses the new startJobCommandHandler
  const handleStartJob = (jobId) => {
    if (!jobId || !selectedTeam) {
        console.warn("Please select a team before starting the job.");
        return;
    }

    const jobToStart = jobs.find(job => job.jobId === jobId);
    if (jobToStart && jobToStart.status !== 'Pending') {
      console.warn(`Job ${jobId} is already ${jobToStart.status}.`);
      return;
    }

    startJobCommandHandler.handle( // Call the new startJobCommandHandler
      StartJobCommand(
        jobId,
        selectedTeam,
        currentUserId 
      )
    );
  };

  return (
    <div className="app">
      <header>
        <h1>Event Sourcing Demo</h1>
      </header>

      <div className="aggregate-blocks">
        {/* Organization Block */}
        <div className="aggregate-block">
          <h2>Organization Aggregate</h2>
          <div className="aggregate-columns">
            <div className="aggregate-column">
              <h3>Commands</h3>
              <form onSubmit={handleCreateOrg} className="command-form">
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Organization name"
                  required
                />
                <button type="submit">Create Organization</button>
              </form>
            </div>
            <ReadModelDisplay
              items={organizations}
              idKey="organizationId"
              renderDetails={(org) => (
                <>
                  <strong>{org.name}</strong>
                  <small>ID: {org.organizationId.slice(0, 8)}...</small>
                </>
              )}
            />
            <EventLogDisplay events={orgEvents} />
          </div>
        </div>

        {/* Customer Block */}
        <div className="aggregate-block">
          <h2>Customer Aggregate</h2>
          <div className="aggregate-columns">
            <div className="aggregate-column">
              <h3>Commands</h3>
              <form onSubmit={handleCreateCustomer} className="command-form">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  required
                />
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  required
                >
                  <option value="">Select Organization</option>
                  {organizations.map(org => (
                    <option key={org.organizationId} value={org.organizationId}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <button type="submit">Create Customer</button>
              </form>
            </div>
            <ReadModelDisplay
              items={customers}
              idKey="customerId"
              renderDetails={(customer) => {
                const org = organizations.find(o => o.organizationId === customer.organizationId);
                return (
                  <>
                    <strong>{customer.name}</strong>
                    <small>Org: {org?.name || 'Unknown'}</small>
                  </>
                );
              }}
            />
            <EventLogDisplay events={customerEvents} />
          </div>
        </div>

        {/* Request Block */}
        <div className="aggregate-block">
          <h2>Request Aggregate</h2>
          <div className="aggregate-columns">
            <div className="aggregate-column">
              <h3>Commands</h3>
              <form onSubmit={handleCreateRequest} className="command-form">
                <input
                  type="text"
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  placeholder="Request title"
                  required
                />
                <textarea
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="Request description (optional)"
                  rows="3"
                ></textarea>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.customerId} value={customer.customerId}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <button type="submit">Create Request</button>
              </form>
            </div>
            <ReadModelDisplay
              items={requests}
              idKey="requestId"
              renderDetails={(request) => {
                const customer = customers.find(c => c.customerId === request.customerId);
                return (
                  <>
                    <strong>{request.requestDetails.title}</strong>
                    <small>
                      For: {customer?.name || 'Unknown Customer'} <br />
                      Status: {request.status}
                    </small>
                  </>
                );
              }}
            />
            <EventLogDisplay events={requestEvents} />
          </div>
        </div>

        {/* Quotation Block */}
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

        {/* Quote Approval Block */}
        <div className="aggregate-block">
          <h2>Quote Approval Aggregate</h2>
          <div className="aggregate-columns">
            <div className="aggregate-column">
                <h3>Commands (via Quote Actions)</h3>
                <p>Approve quotes by clicking the 'Approve Quote' button in the Quotation block above.</p>
            </div>
            <ReadModelDisplay
              items={approvedQuotes}
              idKey="quoteId" 
              renderDetails={(approval) => {
                const approvedQuotation = quotations.find(q => q.quotationId === approval.quoteId);
                const customer = approvedQuotation ? customers.find(c => c.customerId === approvedQuotation.customerId) : null;
                return (
                  <>
                    <strong>Quote Approved: {approvedQuotation?.quotationDetails.title.slice(0, 20)}...</strong>
                    <small>
                      Quote ID: {approval.quoteId.slice(0, 8)}... <br />
                      Approved by: {approval.approvedByUserId} <br />
                      For: {customer?.name || 'Unknown Customer'}
                    </small>
                  </>
                );
              }}
            />
            <EventLogDisplay events={approvalEvents} />
          </div>
        </div>

        {/* Repair Job Block (now explicitly handling 'createJob' and 'startJob' events) */}
        <div className="aggregate-block">
          <h2>Repair Job Aggregate (Create & Start)</h2>
          <div className="aggregate-columns">
            <div className="aggregate-column">
                <h3>Actions</h3>
                <p>Jobs are automatically created when a Quote is Approved.</p>
                <div className="team-selection">
                    <label htmlFor="team-select">Assign Team:</label>
                    <select id="team-select" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                        <option value="Team_A">Team A</option>
                        <option value="Team_B">Team B</option>
                        <option value="Team_C">Team C</option>
                    </select>
                </div>
                <ul className="action-list">
                    {jobs
                        .filter(job => job.status === 'Pending') // Only show "Start" button for pending jobs
                        .map(job => (
                        <li key={job.jobId}>
                            <button 
                                onClick={() => handleStartJob(job.jobId)}
                                disabled={job.status !== 'Pending'}
                            >
                                Start Job {job.jobDetails.title.slice(0, 20)}...
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <ReadModelDisplay
              items={jobs}
              idKey="jobId"
              renderDetails={(job) => {
                const customer = customers.find(c => c.customerId === job.customerId);
                const request = requests.find(r => r.requestId === job.requestId);
                const quote = quotations.find(q => q.quotationId === job.quoteId);
                return (
                  <>
                    <strong>{job.jobDetails.title}</strong>
                    <small>
                      For: {customer?.name || 'Unknown Customer'} <br />
                      From Request: {request?.requestDetails.title.slice(0, 20)}... <br />
                      From Quote: {quote?.quotationDetails.title.slice(0, 20)}... <br />
                      Status: {job.status} {job.jobDetails.assignedTeam && `(${job.jobDetails.assignedTeam})`}
                    </small>
                  </>
                );
              }}
            />
            <EventLogDisplay events={jobEvents} />
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;

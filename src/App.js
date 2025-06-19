import { useEffect, useState } from 'react';
import { eventBus } from './domain/core/eventBus';
import { organizationEventStore, customerEventStore, requestEventStore, quotationEventStore, quoteApprovalEventStore } from './domain/core/eventStore'; // Import new event store
import { organizationCommandHandler } from './domain/features/organization/commandHandler';
import { customerCommandHandler } from './domain/features/customer/commandHandler';
import { requestCommandHandler } from './domain/features/request/commandHandler';
import { CreateRequestCommand } from './domain/features/request/commands';
import { initializeQuotationEventHandler } from './domain/features/quotation/eventHandler';
import { quoteApprovalCommandHandler } from './domain/features/approval/commandHandler'; // Import new command handler
import { ApproveQuoteCommand } from './domain/features/approval/commands'; // Import new command
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

  // State for Quote Approvals (new)
  const [approvedQuotes, setApprovedQuotes] = useState([]);
  const [approvalEvents, setApprovalEvents] = useState([]);
  // For demonstration, let's assume a static user ID for approvals
  const currentUserId = 'user-alice-123'; 

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

    // Quote Approvals (new)
    const approvalEventsLoaded = quoteApprovalEventStore.getEvents();
    setApprovedQuotes(
      approvalEventsLoaded.filter(e => e.type === 'QuoteApproved').map(e => e.data)
    );
    setApprovalEvents(approvalEventsLoaded);

    // Initialize the quotation event handler when the app starts
    initializeQuotationEventHandler();

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

    // Subscribe to QuoteApproved event (new)
    const unsubApproval = eventBus.subscribe('QuoteApproved', (event) => {
      setApprovedQuotes(prev => [...prev, event.data]);
      setApprovalEvents(prev => [...prev, event]);
      // Optional: Update the status of the approved quotation in the 'quotations' read model
      setQuotations(prev => prev.map(q => 
        q.quotationId === event.data.quoteId ? { ...q, status: 'Approved' } : q
      ));
    });


    return () => {
      unsubOrg();
      unsubCustomer();
      unsubRequest();
      unsubQuotation();
      unsubApproval(); // Clean up approval subscription
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

  // Handler for approving a Quote (new)
  const handleApproveQuote = (quoteId) => {
    if (!quoteId) return;

    // Optional: Check if the quote is already approved to prevent re-approvals
    const isAlreadyApproved = approvedQuotes.some(approval => approval.quoteId === quoteId);
    if (isAlreadyApproved) {
      console.warn(`Quote ${quoteId} is already approved.`);
      return;
    }

    quoteApprovalCommandHandler.handle(
      ApproveQuoteCommand(
        quoteId,
        currentUserId // Pass the user who approves the quote
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
            <div className="aggregate-column"> {/* Added a column for commands/actions related to quotation */}
              <h3>Actions</h3>
              {/* No direct commands to create quotation, but actions like "Approve" can be here */}
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

        {/* Quote Approval Block (new) */}
        <div className="aggregate-block">
          <h2>Quote Approval Aggregate</h2>
          <div className="aggregate-columns">
            {/* No direct commands to create an approval, it's triggered by action on Quote */}
            <div className="aggregate-column">
                <h3>Commands (via Quote Actions)</h3>
                <p>Approve quotes by clicking the 'Approve Quote' button in the Quotation block above.</p>
            </div>
            <ReadModelDisplay
              items={approvedQuotes}
              idKey="quoteId" // The ID of the approved quote
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

      </div>
    </div>
  );
}

export default App;

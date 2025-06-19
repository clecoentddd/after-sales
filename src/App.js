import { useEffect, useState } from 'react';
import { eventBus } from './domain/core/eventBus';
import { organizationEventStore, customerEventStore, requestEventStore, quotationEventStore } from './domain/core/eventStore'; // Import requestEventStore and quotationEventStore
import { organizationCommandHandler } from './domain/features/organization/commandHandler';
import { customerCommandHandler } from './domain/features/customer/commandHandler';
import { requestCommandHandler } from './domain/features/request/commandHandler'; // Import requestCommandHandler
import { CreateRequestCommand } from './domain/features/request/commands'; // Import CreateRequestCommand
import { initializeQuotationEventHandler } from './domain/features/quotation/eventHandler'; // Import the quotation event handler
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
  const [selectedCustomerId, setSelectedCustomerId] = useState(''); // To link request to customer

  // State for Quotation (new)
  const [quotations, setQuotations] = useState([]);
  const [quotationEvents, setQuotationEvents] = useState([]);

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

    // Quotations (new)
    const quotationEventsLoaded = quotationEventStore.getEvents();
    setQuotations(
      quotationEventsLoaded.filter(e => e.type === 'QuotationCreated').map(e => e.data)
    );
    setQuotationEvents(quotationEventsLoaded);

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

    // Subscribe to QuotationCreated event (new)
    const unsubQuotation = eventBus.subscribe('QuotationCreated', (event) => {
      setQuotations(prev => [...prev, event.data]);
      setQuotationEvents(prev => [...prev, event]);
    });

    return () => {
      unsubOrg();
      unsubCustomer();
      unsubRequest();
      unsubQuotation(); // Clean up quotation subscription
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
      // In a production app, use a custom modal instead of alert
      console.warn("Please enter a request title and select a customer.");
      return;
    }
    
    requestCommandHandler.handle(
      CreateRequestCommand(
        selectedCustomerId,
        {
          title: requestTitle.trim(),
          description: requestDescription.trim(),
          // Add other request details as needed
        }
      )
    );
    
    setRequestTitle('');
    setRequestDescription('');
    setSelectedCustomerId('');
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
            {/* Command UI */}
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

            {/* Read Model */}
            <div className="aggregate-column">
              <h3>Read Model</h3>
              {organizations.length === 0 ? (
                <p>No organizations yet</p>
              ) : (
                <ul className="model-list">
                  {organizations.map(org => (
                    <li key={org.organizationId}>
                      <strong>{org.name}</strong>
                      <small>ID: {org.organizationId.slice(0, 8)}...</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Events */}
            <div className="aggregate-column">
              <h3>Events</h3>
              {orgEvents.length === 0 ? (
                <p>No events yet</p>
              ) : (
                <ul className="event-list">
                  {orgEvents.map((event, i) => (
                    <li key={i}>
                      <div className="event-type">{event.type}</div>
                      <pre>{JSON.stringify(event.data, null, 2)}</pre>
                      <div className="event-meta">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Customer Block */}
        <div className="aggregate-block">
          <h2>Customer Aggregate</h2>
          
          <div className="aggregate-columns">
            {/* Command UI */}
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

            {/* Read Model */}
            <div className="aggregate-column">
              <h3>Read Model</h3>
              {customers.length === 0 ? (
                <p>No customers yet</p>
              ) : (
                <ul className="model-list">
                  {customers.map(customer => {
                    const org = organizations.find(o => o.organizationId === customer.organizationId);
                    return (
                      <li key={customer.customerId}>
                        <strong>{customer.name}</strong>
                        <small>Org: {org?.name || 'Unknown'}</small>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Events */}
            <div className="aggregate-column">
              <h3>Events</h3>
              {customerEvents.length === 0 ? (
                <p>No events yet</p>
              ) : (
                <ul className="event-list">
                  {customerEvents.map((event, i) => (
                    <li key={i}>
                      <div className="event-type">{event.type}</div>
                      <pre>{JSON.stringify(event.data, null, 2)}</pre>
                      <div className="event-meta">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Request Block */}
        <div className="aggregate-block">
          <h2>Request Aggregate</h2>
          
          <div className="aggregate-columns">
            {/* Command UI */}
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

            {/* Read Model */}
            <div className="aggregate-column">
              <h3>Read Model</h3>
              {requests.length === 0 ? (
                <p>No requests yet</p>
              ) : (
                <ul className="model-list">
                  {requests.map(request => {
                    const customer = customers.find(c => c.customerId === request.customerId);
                    return (
                      <li key={request.requestId}>
                        <strong>{request.requestDetails.title}</strong>
                        <small>
                          For: {customer?.name || 'Unknown Customer'} <br />
                          Status: {request.status}
                        </small>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Events */}
            <div className="aggregate-column">
              <h3>Events</h3>
              {requestEvents.length === 0 ? (
                <p>No events yet</p>
              ) : (
                <ul className="event-list">
                  {requestEvents.map((event, i) => (
                    <li key={i}>
                      <div className="event-type">{event.type}</div>
                      <pre>{JSON.stringify(event.data, null, 2)}</pre>
                      <div className="event-meta">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Quotation Block (new) */}
        <div className="aggregate-block">
          <h2>Quotation Aggregate</h2>
          
          <div className="aggregate-columns">
            {/* Read Model */}
            <div className="aggregate-column full-width-column"> {/* Adjusted for simpler display as no direct command for now */}
              <h3>Read Model (Generated from Requests)</h3>
              {quotations.length === 0 ? (
                <p>No quotations yet</p>
              ) : (
                <ul className="model-list">
                  {quotations.map(quotation => {
                    const customer = customers.find(c => c.customerId === quotation.customerId);
                    const request = requests.find(r => r.requestId === quotation.requestId);
                    return (
                      <li key={quotation.quotationId}>
                        <strong>{quotation.quotationDetails.title}</strong>
                        <small>
                          For: {customer?.name || 'Unknown Customer'} <br />
                          Related Request: {request?.requestDetails.title.slice(0, 20)}... <br />
                          Amount: {quotation.quotationDetails.estimatedAmount} {quotation.quotationDetails.currency} <br />
                          Status: {quotation.status}
                        </small>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Events */}
            <div className="aggregate-column full-width-column"> {/* Adjusted for simpler display */}
              <h3>Events</h3>
              {quotationEvents.length === 0 ? (
                <p>No events yet</p>
              ) : (
                <ul className="event-list">
                  {quotationEvents.map((event, i) => (
                    <li key={i}>
                      <div className="event-type">{event.type}</div>
                      <pre>{JSON.stringify(event.data, null, 2)}</pre>
                      <div className="event-meta">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;

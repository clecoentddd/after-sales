import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import { useOrganizationSlice } from './domain/features/02_OrganisationListProjection/useOrganizationSlice';
import { useCustomerSlice } from './domain/features/04_CustomerListProjection/useCustomerSlice';
import { useRequestSlice } from './domain/features/06_RequestListProjection/useRequestSlice';
import { useQuotationSlice } from './domain/features/08_QuotationListProjection/useQuotationSlice';
import { useQuotationApprovalSlice } from './domain/features/10_QuotationsApprovedList/useQuotationApprovalSlice';
import { useRepairJobSlice } from './domain/features/RepairJobListProjection//useRepairJobSlice';
import { useInvoicingSlice } from './domain/features/18_InvoicesListProjection/UseInvoicingSlice';
import { useChangeRequestSlice } from './domain/features/20_ChangeRequestList/useChangeRequestSlice';

import OrganizationSlice from './components/OrganizationSlice';
import CustomerSlice from './components/CustomerSlice';
import RequestSlice from './components/RequestSlice';
import QuotationSlice from './components/QuotationSlice';
import QuotationApprovalSlice from './components/QuotationApprovalSlice';
import RepairJobSlice from './components/RepairJobSlice';
import InvoicingSlice from './components/InvoicingSlice';
import ChangeRequestSlice from './components/ChangeRequestSlice';
import QuotationSubscriberToChangeRequest from './components/QuotationSubscriberToChangeRequest';
import QuotationApprovalMonitor from './components/QuotationApprovalMonitor';

import EventsPage from './EventsPage';  // import your new EventsPage
import LiveModelPage from './LiveModelPage'; // Assuming you have a LiveModelPage component
import ToDoListPage from './ToDoChangeRequestProcessPage'; // Assuming you have a ToDoListPage component

import { initializeQuotationEventHandler } from './domain/features/07_CreateQuotation/eventHandler';
import { initializeCreateJobEventHandler } from './domain/features/11_CreateJobAutomation/eventHandler';
import { initializeInvoiceFromJobCompletionHandler } from './domain/features/17_CreateInnvoice/initializeInvoiceFromJobCompletion';
// import { initializeAssignJobToChangeRequestProcessor } from './domain/features/99_changeRequestToJobReactionProcessor/initializeAssignJobToChangeRequestProcessor';
import { initializeAssignCreatedJobToChangeRequestProcessor } from './domain/features/99_changeRequestToJobReactionProcessor/initializeAssignCreatedJobToChangeRequestProcessor';
import { initializeAssignStartedJobToChangeRequestProcessor } from './domain/features/99_changeRequestToJobReactionProcessor/initializeAssignStartedJobToChangeRequestProcessor';
import { initializeAssignCompleteJobToChangeRequestProcessor } from './domain/features/99_changeRequestToJobReactionProcessor/initializeAssignCompleteJobToChangeRequestProcessor';
import { initializeChangeRequestDecisionTreeHandler } from './domain/features/19a_ChangeRequestDecisionTree/eventHandler';
import {initializeCompleteJobEventHandler } from './domain/features/27_CloseRequest/eventHandler';
import {initializeToDoJobToAssessChangeRequest} from './domain/features/98_AssignJobToChangeRequestProcessor/initializeAssignToDoJobToAssessChangeRequestProcessor';

import { useEffect } from 'react';

function App() {
  const currentUserId = 'user-alice-123';

  const { organizations, orgEvents } = useOrganizationSlice();
  const { customers, customerEvents } = useCustomerSlice();
  const { requests, requestEvents } = useRequestSlice();
  const { quotations, quotationEvents } = useQuotationSlice();
  console.log('Quotations in App.js:', quotations);
  const { approvedQuotations, approvalEvents } = useQuotationApprovalSlice();
  const { jobs, jobEvents } = useRepairJobSlice();
  const { invoices, invoiceEvents } = useInvoicingSlice();
  const { changeRequests, changeRequestEvents } = useChangeRequestSlice();

  // Initialize event handlers only once
  useEffect(() => {
    initializeQuotationEventHandler();
    initializeCreateJobEventHandler();
    initializeInvoiceFromJobCompletionHandler();
    // initializeAssignJobToChangeRequestProcessor();
    initializeAssignCreatedJobToChangeRequestProcessor();
    initializeAssignStartedJobToChangeRequestProcessor();
    initializeAssignCompleteJobToChangeRequestProcessor();
    initializeChangeRequestDecisionTreeHandler();
    initializeCompleteJobEventHandler();
    initializeToDoJobToAssessChangeRequest();
  }, []);

  return (
    <Router>
      <div className="app">
        <header>
          <h1>Event Sourcing Demo</h1>
          <nav style={{ marginBottom: 20 }}>
           <Link to="/" style={{ marginRight: '15px' }}>Home</Link>
            <Link to="/events" style={{ marginRight: '15px' }}>Events</Link>
            <Link to="/liveModel" style={{ marginRight: '15px' }}>RequestStatus</Link>
            <Link to="/toDoList" style={{ marginRight: '15px' }}>ToDoList</Link>
          </nav>
        </header>

        <Routes>
          <Route
            path="/"
            element={
              <div className="aggregate-blocks">
                <OrganizationSlice organizations={organizations} orgEvents={orgEvents} />
                <CustomerSlice customers={customers} customerEvents={customerEvents} organizations={organizations} />
                <RequestSlice requests={requests} requestEvents={requestEvents} customers={customers} />
                <QuotationSlice
                  quotations={quotations}
                  quotationEvents={quotationEvents}
                  approvedQuotations={approvedQuotations}
                  customers={customers}
                  requests={requests}
                  currentUserId={currentUserId}
                />
                <QuotationApprovalSlice
                  approvedQuotations={approvedQuotations}
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

                <QuotationSubscriberToChangeRequest />
                <QuotationApprovalMonitor currentUserId={currentUserId} quotations={quotations} />
              </div>
            }
          />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/liveModel" element={<LiveModelPage />} />
          <Route path="/toDoList" element={<ToDoListPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

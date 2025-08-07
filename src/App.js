import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import { useOrganizationSlice } from './domain/features/00_Organisation Management/02_OrganisationListProjection/useOrganizationSlice.js';
import { useCustomerSlice } from './domain/features/00_CustomerManagement/04_CustomerListProjection/useCustomerSlice';
import { useRequestSlice } from './domain/features/00_RequestManagement/06_RequestListProjection/useRequestSlice';
import { useQuotationSlice } from './domain/features/00_QuotationManagement/08_QuotationListProjection/useQuotationSlice';
import { useQuotationApprovalSlice } from './domain/features/00_QuotationManagement/useQuotationApprovalSlice';
import { useRepairJobSlice } from './domain/features/00_JobManagement/RepairJobListProjection/useRepairJobSlice';
import { useInvoicingSlice } from './domain/features/00_InvoiceManagement/18_InvoicesListProjection/UseInvoicingSlice';
import { useChangeRequestSlice } from './domain/features/00_RequestManagement/20_ChangeRequestList/useChangeRequestSlice';

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

import { initializeQuotationEventHandler } from './domain/features/00_QuotationManagement/07_CreateQuotation/eventHandler';
import { initializeCreateJobEventHandler } from './domain/features/00_JobManagement/11_CreateJobAutomation/eventHandler';
import { initializeInvoiceFromJobCompletionHandler } from './domain/features/00_InvoiceManagement/17_CreateInnvoice/initializeInvoiceFromJobCompletion';

import { initializeAssignCreatedJobToChangeRequestProcessor } from './domain/features/00_JobManagement/23a_SetTodoToPutJobOnHold/initializeAssignCreatedJobToChangeRequestProcessor';

import { initializeAssignStartedJobToChangeRequestProcessor } from './domain/features/00_JobManagement/29a_SetupJobChangeRequestAssessmentTodoList/initializeAssignStartedJobToChangeRequestProcessor';
import { initializeAssignCompleteJobToChangeRequestProcessor } from './domain/features/00_JobManagement/32a_SetUpToDoClosedJobsChangeRquestProcess/initializeAssignCompleteJobToChangeRequestProcessor';
import { initializeChangeRequestDecisionTreeHandler } from './domain/features/00_RequestManagement/19a_ChangeRequestDecisionTree/eventHandler';
import {initializeCompleteJobEventHandler } from './domain/features/00_RequestManagement/27_CloseRequest/eventHandler';
// to do list for jon change request
import { initializeToDoCreatedJobToAssessChangeRequest } from './domain/features/00_JobManagement/23b_PutJobOnHold/toDoCreatedJobToAssessChangeRequestProcessor.js.js';
import { initializeToDoStartedJobToAssessChangeRequest } from './domain/features/00_JobManagement/29b_JobChangeRequestAssessment/toDoStartedJobToAssessChangeRequestProcessor.js';
import { initializeToDoCompleteJobToAssessChangeRequest } from './domain/features/00_JobManagement/32b_CompleteJobChangeRequestAssessment/toDoCompleteJobToAssessChangeRequestProcessor.js';


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

    initializeChangeRequestDecisionTreeHandler();
    initializeCompleteJobEventHandler();
    // initialize todo list
    initializeAssignCreatedJobToChangeRequestProcessor();
    initializeAssignStartedJobToChangeRequestProcessor();
    initializeAssignCompleteJobToChangeRequestProcessor();
    // to do list
    initializeToDoCreatedJobToAssessChangeRequest();
    initializeToDoStartedJobToAssessChangeRequest();
    initializeToDoCompleteJobToAssessChangeRequest();
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

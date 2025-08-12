import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Projections
import { queryCustomersProjection } from './domain/features/02_CustomerManagement/CustomerListProjection/customerProjectionHandler';
import { queryQuotationsProjection } from './domain/features/04_QuotationManagement/shared/quotationProjectionDB';

import { useProjectionOrganizationList } from './domain/features/01_OrganizationManagement/02_OrganizationListProjection/projectionOrganizationList';

import { useRepairJobSlice } from './domain/features/05_JobManagement/RepairJobListProjection/useRepairJobSlice';
import { useInvoicingSlice } from './domain/features/06_InvoiceManagement/18_InvoicesListProjection/UseInvoicingSlice';
import { useChangeRequestSlice } from './domain/features/03_RequestManagement/20_ChangeRequestList/useChangeRequestSlice';

import OrganizationSlice from './components/OrganizationSlice';
import CustomerSlice from './components/CustomerSlice';
import RequestSlice from './components/RequestSlice';
import QuotationSlice from './components/QuotationSlice';
import RepairJobSlice from './components/RepairJobSlice';
import InvoicingSlice from './components/InvoicingSlice';
import ChangeRequestSlice from './components/ChangeRequestSlice';
import QuotationSubscriberToChangeRequest from './components/QuotationSubscriberToChangeRequest';
// import QuotationApprovalMonitor from './components/QuotationApprovalMonitor';

import EventsPage from './EventsPage';  // import your new EventsPage
import LiveModelPage from './LiveModelPage'; // Assuming you have a LiveModelPage component
import ToDoListPage from './ToDoChangeRequestProcessPage'; // Assuming you have a ToDoListPage component

import { globalQuotationInit } from './domain/features/04_QuotationManagement/shared/globalQuotationInit';
import { globalRequestInit } from '@features/03_RequestManagement/shared/globalRequestInit';
import { globalInvoiceInit } from '@features/06_InvoiceManagement/shared/globalInvoiceInit';


import { initializeCreateJobEventHandler } from '@features/05_JobManagement/11_CreateJobAutomation/eventHandler';

import { initializeAssignCreatedJobToChangeRequestProcessor } from '@features/05_JobManagement/23a_SetTodoToPutJobOnHold/initializeAssignCreatedJobToChangeRequestProcessor';
import { initializeAssignStartedJobToChangeRequestProcessor } from '@features/05_JobManagement/29a_SetupJobChangeRequestAssessmentTodoList/initializeAssignStartedJobToChangeRequestProcessor';
import { initializeAssignCompleteJobToChangeRequestProcessor } from '@features/05_JobManagement/32a_SetUpToDoClosedJobsChangeRquestProcess/initializeAssignCompleteJobToChangeRequestProcessor';

import { initializeChangeRequestDecisionTreeHandler } from '@features/03_RequestManagement/19a_ChangeRequestDecisionTree/eventHandler';
import { initializeCompleteJobEventHandler } from '@features/03_RequestManagement/27_CloseRequest/eventHandler';
// to do list for jon change request
import { initializeToDoCreatedJobToAssessChangeRequest } from './domain/features/05_JobManagement/23b_PutJobOnHold/toDoCreatedJobToAssessChangeRequestProcessor.js.js';
import { initializeToDoStartedJobToAssessChangeRequest } from './domain/features/05_JobManagement/29b_JobChangeRequestAssessment/toDoStartedJobToAssessChangeRequestProcessor.js';
import { initializeToDoCompleteJobToAssessChangeRequest } from './domain/features/05_JobManagement/32b_CompleteJobChangeRequestAssessment/toDoCompleteJobToAssessChangeRequestProcessor.js';


import { useEffect } from 'react';
import { queryRequestsProjection } from '@domain/features/03_RequestManagement/shared/requestProjectionDB';

function App() {
  const currentUserId = 'user-alice-123';

  // customers projection
  const customers = queryCustomersProjection();
  const quotations = queryQuotationsProjection();
  const requests = queryRequestsProjection

  const { organizations, orgEvents } = useProjectionOrganizationList();  
  
  const { jobs, jobEvents } = useRepairJobSlice();
  const { invoices, invoiceEvents } = useInvoicingSlice();
  const { changeRequests, changeRequestEvents } = useChangeRequestSlice();

  // Initialize event handlers only once
  useEffect(() => {
    globalQuotationInit();
    globalRequestInit();
    globalInvoiceInit();
    initializeCreateJobEventHandler();

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
            <Link to="/toDoList" style={{ marginRight: '15px' }}>Change Request ToDoList</Link>
          </nav>
        </header>

        <Routes>
          <Route
            path="/"
            element={
              <div className="aggregate-blocks">
                <OrganizationSlice
                   organizations={organizations} 
                   orgEvents={orgEvents} />
                <CustomerSlice customers={customers} organizations={organizations}/>
                <RequestSlice requests={requests} customers={customers} />
                <QuotationSlice
                    customers={customers}
                    requests={requests}
                    currentUserId={currentUserId}
                />
                <RepairJobSlice
                  jobs={jobs}
                  jobEvents={jobEvents}
                  customers={customers}
                  quotations={quotations}
                  requests={requests}
                  currentUserId={currentUserId}
                />
                <InvoicingSlice
                  invoices={invoices}
                  invoiceEvents={invoiceEvents}
                  customers={customers}
                  quotations={quotations}
                  jobs={jobs}
                />
                <ChangeRequestSlice
                  changeRequests={changeRequests}
                  changeRequestEvents={changeRequestEvents}
                  requests={requests}
                  currentUserId={currentUserId}
                />

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

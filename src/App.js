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
import EventsPage from './EventsPage';
import LiveModelPage from './LiveModelPage';
import ToDoListPage from './ToDoChangeRequestProcessPage';
import { globalQuotationInit } from './domain/features/04_QuotationManagement/shared/globalQuotationInit';
import { globalRequestInit } from '@features/03_RequestManagement/shared/globalRequestInit';
import { globalInvoiceInit } from '@features/06_InvoiceManagement/shared/globalInvoiceInit';

import { initializeCreateJobEventHandler } from '@features/05_JobManagement/11_CreateJobAutomation/eventHandler';
import { initializeAssignJobToChangeRequestProcessor } from '@features/05_JobManagement/90_AssignJobToChangeRequest/initializeAssignJobToChangeRequestProcessor';
import {initializeCreatedJobChangeRequestProcessManager } from '@features/05_JobManagement/92_JobChangeRequestManager/initializeCreatedJobChangeRequestProcessManager';
import { initializeChangeRequestDecisionTreeHandler } from '@features/03_RequestManagement/19a_ChangeRequestDecisionTree/eventHandler';
import { initializeCompleteJobEventHandler } from '@features/03_RequestManagement/27_CloseRequest/eventHandler';

import { queryRequestsProjection } from '@features/03_RequestManagement/shared/requestProjectionDB';
import { useEffect } from 'react';
import { useToDoChangeRequestProjection } from '@domain/features/05_JobManagement/91_ToDoChangeRequestProjection/useToDoChangeRequestProjection';

// app.js

import { eventBus } from '@core/eventBus';

// --- DEBUG WRAPPER ---
const originalSubscribe = eventBus.subscribe.bind(eventBus);
eventBus.subscribe = (eventType, handler) => {
  console.log(`[DEBUG] Subscribing to ${eventType}`);
  return originalSubscribe(eventType, (event) => {
    console.log(`[DEBUG] Event received by subscriber for ${eventType}:`, event);
    handler(event);
  });
};

const originalPublish = eventBus.publish.bind(eventBus);
eventBus.publish = (event) => {
  console.log('[DEBUG] Publishing event object:', event);
  return originalPublish(event);
};

// Optional catch-all
eventBus.subscribe('*', (event) => {
  console.log('[DEBUG] CATCH-ALL saw event:', event);
});
// --- END DEBUG WRAPPER ---


function App() {
  const currentUserId = 'user-alice-123';
  // Customers projection
  const customers = queryCustomersProjection();
  // Quotations projection
  const quotations = queryQuotationsProjection();
  // Requests projection
  const requests = queryRequestsProjection();
  // Organizations projection
  const { organizations, orgEvents } = useProjectionOrganizationList();
  // Jobs projection
  const { jobs, jobEvents } = useRepairJobSlice();
  // Invoices projection
  const { invoices, invoiceEvents } = useInvoicingSlice();
  // Change requests projection
  const { changeRequests, changeRequestEvents } = useChangeRequestSlice();
  // To-Do projection
  useToDoChangeRequestProjection();

  // Initialize event handlers only once
  useEffect(() => {
    console.log('[App] Initializing projections and event handlers...');
    globalQuotationInit();
    globalRequestInit();
    globalInvoiceInit();
    initializeCreateJobEventHandler();
    initializeChangeRequestDecisionTreeHandler();
    initializeCompleteJobEventHandler();
    initializeAssignJobToChangeRequestProcessor();
    initializeCreatedJobChangeRequestProcessManager();
    // ONLY call initializeProjections (which includes initializeAssignJobToChangeRequestProcessor)
    
    console.log('[App] Projections and event handlers initialized.');

  }, []); // Empty dependency array ensures this runs only once

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
                <OrganizationSlice organizations={organizations} orgEvents={orgEvents} />
                <CustomerSlice customers={customers} organizations={organizations} />
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

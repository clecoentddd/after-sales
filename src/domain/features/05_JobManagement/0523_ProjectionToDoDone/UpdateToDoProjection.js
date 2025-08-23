import { eventBus } from '@core/eventBus';
import { updateToDo } from '@features/05_JobManagement/0521_ToDo_ChangeRequest_To_Assess/toDoDB';

let isInitialized = false;

export const initializeToDoStatusUpdateProjection = () => {
  if (isInitialized) {
    console.log('[ToDoStatusProjection] Already initialized. Skipping.');
    return () => {};
  }

  const unsubscribePending = eventBus.subscribe('ChangeRequestReceivedPendingAssessment', (event) => {
    console.log('[ToDoStatusProjection] Handling ChangeRequestReceivedPendingAssessment for changeRequest:', event.changeRequestId);
    updateToDo(event.changeRequestId, {
      flag: "done",    // Update flag to "processed"
      CRstatus: event.data.CRstatus
    });
  });

  const unsubscribeRejected = eventBus.subscribe('JobChangeRequestRejected', (event) => {
    console.log('[ToDoStatusProjection] Handling JobChangeRequestRejected for changeRequest:', event.changeRequestId);
    updateToDo(event.changeRequestId, {
      flag: "done",    // Update flag to "processed"
      CRstatus: event.data.CRstatus
    });
  });

  const unsubscribeOnHold = eventBus.subscribe('JobOnHold', (event) => {
    console.log('[ToDoStatusProjection] Handling JobOnHold for changeRequest:', event.changeRequestId);
    updateToDo(event.changeRequestId, {
      flag: "done",    // Update flag to "processed"
      CRstatus: event.data.CRstatus
    });
  });

  isInitialized = true;
  console.log('[ToDoStatusProjection] Subscribed to ChangeRequestReceivedPendingAssessment, JobChangeRequestRejected, and JobOnHold.');

  return () => {
    console.log('[ToDoStatusProjection] Unsubscribing from all events...');
    unsubscribePending();
    unsubscribeRejected();
    unsubscribeOnHold();
    isInitialized = false;
  };
};

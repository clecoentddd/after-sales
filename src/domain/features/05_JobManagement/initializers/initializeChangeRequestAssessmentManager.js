// features/05_JobManagement/initializer.js
import { initializeToDoProjection } from '../0521_ToDo_ChangeRequest_To_Assess/initializeToDoProjection';
import { initializeChangeRequestProcessor } from '../0522_AssessAnyChangeRequest/processChangeRequests';
import {initializeToDoStatusUpdateProjection } from '../0523_ProjectionToDoDone/UpdateToDoProjection';
export const initializeChangeRequestAssessmentManager = () => {

  console.log('Global Initializer for change request assessment process');

  const processorUnsubscribe = initializeChangeRequestProcessor();
  const toDoUnsubscribe = initializeToDoProjection();
  const toDoUpdateUnsubscribe = initializeToDoStatusUpdateProjection();


  return () => {
    toDoUnsubscribe();
    processorUnsubscribe();
    toDoUpdateUnsubscribe();
  };
};
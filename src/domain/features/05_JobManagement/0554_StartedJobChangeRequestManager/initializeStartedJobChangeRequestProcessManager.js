// src/domain/features/05_JobManagement/93_JobChangeRequestAssessmentManager/initializeStartedJobChangeRequestProcessManager.js
import { eventBus } from '@core/eventBus';
import { jobEventStore } from '@core/eventStore';
import { FlagJobForAssessmentCommand } from '../0512_AssessChangeRequest/commands';
import { JobAggregate } from '@entities/Job/aggregate';

let isInitialized = false;

export const initializeStartedJobChangeRequestProcessManager = () => {
  if (isInitialized) {
    console.log('[JobChangeRequestAssessmentManager] Already initialized. Skipping.');
    return;
  }

  eventBus.subscribe('ChangeRequestJobAssigned', (event) => {
    console.log('[JobChangeRequestAssessmentManager] Received ChangeRequestJobAssigned event:', event.aggregateId);

    const allEvents = jobEventStore.getEvents();
    console.log('[JobChangeRequestAssessmentManager] Total events in store:', allEvents.length);

    // Step 1: Candidate job — started but not completed
    const jobStartedEvent = allEvents.find(e =>
      e.aggregateId === event.aggregateId && e.type === 'JobStarted'
    );
    const jobCompletedEvent = allEvents.find(e =>
      e.aggregateId === event.aggregateId && e.type === 'JobCompleted'
    );

    if (!jobStartedEvent || jobCompletedEvent) {
      console.log(`[JobChangeRequestAssessmentManager] Job ${event.aggregateId} is either not started or already completed. Skipping.`);
      return;
    }

    // Step 2: Rebuild the aggregate state to check latest CRstatus
    const aggregate = new JobAggregate();
    const jobEvents = allEvents
      .filter(e => e.aggregateId === event.aggregateId)
      .sort((a, b) => new Date(a.metadata.timestamp) - new Date(b.metadata.timestamp));

    jobEvents.forEach(e => aggregate.apply(e));
    console.log('[JobChangeRequestAssessmentManager] Replayed events for aggregate:', jobEvents.length);

    // Step 3: Check latest CRstatus
    if (aggregate.CRstatus) {
    console.warn(`[JobChangeRequestAssessmentManager] Job ${event.aggregateId} already has CRstatus "${aggregate.CRstatus}". Skipping.`);
    return;
  }

    try {
      // Step 4: Create command and flag job for assessment
      const command = FlagJobForAssessmentCommand(
        event.aggregateId,
        event.data.requestId,
        event.data.changeRequestId,
        "Automated Entry By the System",
        "Change request started - assessment required"
      );

      console.log('[JobChangeRequestAssessmentManager] Creating assessment command:', command);

      const assessmentEvent = aggregate.flagForAssessment(command);

      if (assessmentEvent) {
        jobEventStore.append(assessmentEvent);
        eventBus.publish(assessmentEvent);
        console.log(`[JobChangeRequestAssessmentManager] Job ${event.aggregateId} flagged for assessment.`);
      }
    } catch (error) {
      console.error('[JobChangeRequestAssessmentManager] Error flagging job for assessment:', error);
    }
  });

  isInitialized = true;
  console.log('[JobChangeRequestAssessmentManager] Initialized.');
};

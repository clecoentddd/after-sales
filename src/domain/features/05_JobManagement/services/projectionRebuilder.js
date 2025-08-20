// src/domain/features/05_JobManagement/services/projectionRebuilder.js
import { jobEventStore } from '@core/eventStore';
import { jobStorage } from '../projectionDB/sharedJobStorage';

export const rebuildProjections = async (projections = []) => {
  console.log('[ProjectionRebuilder] Starting rebuild...');

  // Reset shared storage
  jobStorage.reset();

  // Notify all projections to show empty state
  projections.forEach(proj => proj.notify());

  // Wait for visual feedback
  await new Promise(resolve => setTimeout(resolve, 500));

  // Get all events once and sort them chronologically
  const events = await jobEventStore.getEvents();
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.timestamp || a.metadata?.timestamp) -
    new Date(b.timestamp || b.metadata?.timestamp)
  );

  // Process events in order
  sortedEvents.forEach(event => {
    projections.forEach(projection => {
      // Use each projection's existing handleEvent method
      projection.handleEvent(event, { notify: false });
    });
  });

  // Final notification after all events are processed
  projections.forEach(proj => proj.notify());

  console.log('[ProjectionRebuilder] Rebuild complete');
};

// completeJob/aggregate.js
// Defines the CompleteJobAggregate, responsible for creating JobCompletedEvent.

import { JobCompletedEvent } from './events';

export class CompleteJobAggregate {
  /**
   * Static method to process a CompleteJobCommand, emitting a JobCompletedEvent.
   * In a real system, this might involve final validations before marking as complete.
   * @param {object} command - The command object (e.g., CompleteJobCommand).
   * @param {string} command.jobId - The ID of the job to complete.
   * @param {string} command.completedByUserId - The ID of the user who completed the job.
   * @param {object} command.completionDetails - Optional details about completion.
   * @returns {object} A JobCompletedEvent.
   */
  static complete(command) {
    console.log(`[CompleteJobAggregate] Completing job ${command.jobId}`);
    return JobCompletedEvent(
      command.jobId,
      command.completedByUserId,
      command.completionDetails
    );
  }
}

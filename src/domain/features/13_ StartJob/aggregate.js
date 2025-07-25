// src/domain/features/startJob/aggregate.js
// Defines the StartJobAggregate, responsible for creating JobStartedEvent.

import { JobStartedEvent } from './events'; // Ensure this import path is correct and resolves to the file above

export class StartJobAggregate {
  /**
   * Static method to process a StartJobCommand, emitting a JobStartedEvent.
   * This method simulates the action of starting a job and assigning a team.
   * @param {object} command - The command object (e.g., StartJobCommand).
   * @param {string} command.jobId - The ID of the job to start.
   * @param {string} command.assignedTeam - The team assigned to the job.
   * @param {string} command.startedByUserId - The ID of the user who started the job.
   * @returns {object} A JobStartedEvent.
   */
  static start(command) {
    console.log(`[StartJobAggregate] Starting job ${command.jobId} and assigning to ${command.assignedTeam}`);
    return JobStartedEvent( // This is the line where the error occurs
      command.jobId,
      command.assignedTeam,
      command.startedByUserId
    );
  }
}

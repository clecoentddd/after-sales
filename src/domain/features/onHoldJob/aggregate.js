// src/domain/features/onHoldJob/aggregate.js
// Defines the OnHoldJobAggregate, responsible for creating JobOnHoldEvent.

import { JobOnHoldEvent } from './events';

export class OnHoldJobAggregate {
  /**
   * Static method to process a PutJobOnHoldCommand, emitting a JobOnHoldEvent.
   * @param {object} command - The command object (e.g., PutJobOnHoldCommand).
   * @param {string} command.jobId - The ID of the job to put on hold.
   * @param {string} command.heldByUserId - The ID of the user who put the job on hold.
   * @param {string} command.reason - The reason for holding the job.
   * @returns {object} A JobOnHoldEvent.
   */
  static putOnHold(command) {
    console.log(`[OnHoldJobAggregate] Putting job ${command.jobId} on hold due to: ${command.reason}`);
    return JobOnHoldEvent(
      command.jobId,
      command.heldByUserId,
      command.reason
    );
  }
}

// src/domain/features/11_CreateJobAutomation/commandHandler.js

import { jobEventStore } from '../../core/eventStore';
import { eventBus } from '../../core/eventBus';
import { JobAggregate } from '../../entities/Job/aggregate'; // Import the JobAggregate
import { CreateJobFromApprovedQuotationCommand } from './commands';

export const createJobCommandHandler = {
  handle(command) {
    if (command.type !== 'CreateJobFromApprovedQuotation') {
      console.warn(`[CreateJobCommandHandler] Unknown command type: ${command.type}`);
      return { success: false, message: 'Unsupported command' };
    }

    console.log(`[CreateJobCommandHandler] Handling command: ${command.type}`, command);

    const jobCreatedEvent = JobAggregate.createFromQuotationApproval(
      command.customerId,
      command.requestId,
      command.quotationId,
      command.requestDetails
    );

    jobEventStore.append(jobCreatedEvent);
    eventBus.publish(jobCreatedEvent);

    console.log(`[CreateJobCommandHandler] Published JobCreated event:`, jobCreatedEvent);

    return { success: true, event: jobCreatedEvent };
  }
};

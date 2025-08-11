// src/domain/features/11_CreateJobAutomation/eventHandler.js

import { eventBus } from '@core/eventBus';
import {
  jobEventStore,
  quotationEventStore,
  requestEventStore
} from '@core/eventStore';

import { createJobCommandHandler } from './commandHandler';
import { CreateJobFromApprovedQuotationCommand } from './commands';

let isCreateJobEventHandlerInitialized = false;

export const initializeCreateJobEventHandler = () => {
  if (isCreateJobEventHandlerInitialized) return;

  eventBus.subscribe('QuotationHasBeenApproved', (event) => {
    console.log(`[CreateJobEventHandler] Received QuotationApproved event:`, event);

    const command = new CreateJobFromApprovedQuotationCommand({
      requestId: event.data.requestId,
      changeRequestId: event.data.changeRequestId,
      quotationId: event.quotationId,
      quotationDetails: event.data.quotationDetails
    });

    createJobCommandHandler.handle(command);
  });

  isCreateJobEventHandlerInitialized = true;
  console.log('[CreateJobEventHandler] Subscribed to QuotationApproved events');
};

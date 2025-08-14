// src/domain/features/11_CreateJobAutomation/eventHandler.js

import { eventBus } from '@core/eventBus';
import { createJobCommandHandler } from './commandHandler';
import { CreateJobFromApprovedQuotationCommand } from './commands';

let isCreateJobEventHandlerInitialized = false;

export const initializeCreateJobEventHandler = () => {
  if (isCreateJobEventHandlerInitialized) return;

  eventBus.subscribe('QuotationHasBeenApproved', (event) => {
    console.log(`[CreateJobEventHandler] Received QuotationApproved event:`, event);

    const command = new CreateJobFromApprovedQuotationCommand({
      quotationId: event.quotationId,
      requestId: event.requestId,
      changeRequestId: event.changeRequestId,
      quotationDetails: event.data.quotationDetails
    });

    createJobCommandHandler.handle(command);
  });

  isCreateJobEventHandlerInitialized = true;
  console.log('[CreateJobEventHandler] Subscribed to QuotationApproved events');
};

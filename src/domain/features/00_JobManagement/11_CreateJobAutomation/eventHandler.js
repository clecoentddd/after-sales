// src/domain/features/11_CreateJobAutomation/eventHandler.js

import { eventBus } from '../../../core/eventBus';
import {
  jobEventStore,
  quotationEventStore,
  requestEventStore
} from '../../../core/eventStore';

import { createJobCommandHandler } from './commandHandler';
import { CreateJobFromApprovedQuotationCommand } from './commands';

let isCreateJobEventHandlerInitialized = false;

export const initializeCreateJobEventHandler = () => {
  if (isCreateJobEventHandlerInitialized) return;

  eventBus.subscribe('QuotationApproved', (event) => {
    console.log(`[CreateJobEventHandler] Received QuotationApproved event:`, event);

    const { quotationId } = event.data;

    const quotation = quotationEventStore
      .getEvents()
      .find(e => e.type === 'QuotationCreated' && e.data.quotationId === quotationId)?.data;

    if (!quotation) {
      console.error(`[CreateJobEventHandler] Could not find quotation for quotationId: ${quotationId}`);
      return;
    }

    const request = requestEventStore
      .getEvents()
      .find(e => e.type === 'RequestCreated' && e.data.requestId === quotation.requestId)?.data;

    if (!request) {
      console.error(`[CreateJobEventHandler] Could not find request for requestId: ${quotation.requestId}`);
      return;
    }

    const command = new CreateJobFromApprovedQuotationCommand({
      customerId: quotation.customerId,
      requestId: quotation.requestId,
      quotationId: quotation.quotationId,
      requestDetails: request.requestDetails
    });

    createJobCommandHandler.handle(command);
  });

  isCreateJobEventHandlerInitialized = true;
  console.log('[CreateJobEventHandler] Subscribed to QuotationApproved events');
};

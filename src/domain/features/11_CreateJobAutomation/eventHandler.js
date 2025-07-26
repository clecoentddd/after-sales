// src/domain/features/11_CreateJobAutomation/eventHandler.js

import { eventBus } from '../../core/eventBus';
import {
  jobEventStore,
  quotationEventStore,
  requestEventStore
} from '../../core/eventStore';

import { createJobCommandHandler } from './commandHandler';
import { CreateJobFromApprovedQuoteCommand } from './commands';

let isCreateJobEventHandlerInitialized = false;

export const initializeCreateJobEventHandler = () => {
  if (isCreateJobEventHandlerInitialized) return;

  eventBus.subscribe('QuoteApproved', (event) => {
    console.log(`[CreateJobEventHandler] Received QuoteApproved event:`, event);

    const { quoteId } = event.data;

    const quotation = quotationEventStore
      .getEvents()
      .find(e => e.type === 'QuotationCreated' && e.data.quoteId === quoteId)?.data;

    if (!quotation) {
      console.error(`[CreateJobEventHandler] Could not find quotation for quoteId: ${quoteId}`);
      return;
    }

    const request = requestEventStore
      .getEvents()
      .find(e => e.type === 'RequestCreated' && e.data.requestId === quotation.requestId)?.data;

    if (!request) {
      console.error(`[CreateJobEventHandler] Could not find request for requestId: ${quotation.requestId}`);
      return;
    }

    const command = new CreateJobFromApprovedQuoteCommand({
      customerId: quotation.customerId,
      requestId: quotation.requestId,
      quoteId: quotation.quoteId,
      requestDetails: request.requestDetails
    });

    createJobCommandHandler.handle(command);
  });

  isCreateJobEventHandlerInitialized = true;
  console.log('[CreateJobEventHandler] Subscribed to QuoteApproved events');
};

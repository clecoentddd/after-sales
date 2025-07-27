// src/domain/features/ChangeRequestDecisionTree/eventHandler.js

import { eventBus } from '../../core/eventBus';
import { ChangeRequestDecisionTreeProjection } from './projection';

let isInitialized = false;

export const initializeChangeRequestDecisionTreeHandler = () => {
  if (isInitialized) return;

  const subscribedEvents = [
    'RequestCreated',
    'QuotationCreated',
    'QuotationApproved',
    'JobCreated',
    'JobStarted',
    'JobOnHold',
    'JobCompleted',
  ];

  subscribedEvents.forEach((eventType) => {
    eventBus.subscribe(eventType, (event) => {
      console.log(`[DecisionTreeHandler] Received ${eventType}`);
      ChangeRequestDecisionTreeProjection.handleEvent(event);
    });
  });

  isInitialized = true;
  console.log('[DecisionTreeHandler] Subscribed to all decision-tree related events.');
};

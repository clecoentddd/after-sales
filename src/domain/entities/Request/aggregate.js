// src/domain/entities/RequestAggregate.js

import { RequestRaisedEvent } from "../../events/requestRaisedEvent";
import { RequestClosedEvent } from "../../events/requestClosedEvent";
import { ChangeRequestRaisedEvent } from "../../events/changeRequestRaisedEvent";
import { ChangeRequestRejectedDueToClosedRequest } from "../../events/changeRequestRejectedDueToClosedRequest";

export class RequestAggregate {
  constructor() {
    this.state = null;
    this.changeRequests = [];
  }

  replay(events) {
    console.log('[RequestAggregate] Replaying events to rebuild state...');
    for (const event of events) {
      this.apply(event);
    }
    console.log('[RequestAggregate] State after replay:', this.state);
    console.log('[RequestAggregate] ChangeRequests after replay:', this.changeRequests);
  }

  apply(event) {
    console.log('[RequestAggregate] Applying event of type:', event.type);

    switch (event.type) {
      case 'RequestRaised':
        this.state = {
          requestId: event.aggregateId,
          changeRequestId: event.data.changeRequestId,
          customerId: event.data.customerId,
          requestDetails: event.data.requestDetails,
          status: event.data.status,
          currentVersion: event.data.versionId || 1
        };
        this.changeRequests = [];
        break;

      case 'RequestClosed':
        if (this.state) {
          this.state.status = 'Closed';
        }
        break;

      case 'ChangeRequestRaised':
        if (!this.changeRequests) this.changeRequests = [];
        this.changeRequests.push({
          changeRequestId: event.data.changeRequestId,
          versionId: this.state.currentVersion + 1,
          changedByUserId: event.data.changedByUserId,
          description: event.data.description,
          status: 'Pending',
          createdAt: event.timestamp || new Date().toISOString()
        });
        this.state.currentVersion++;
        break;

      case 'ChangeRequestRejectedDueToClosedRequest':
        const cr = this.changeRequests.find(cr => cr.changeRequestId === event.data.changeRequestId);
        if (cr) cr.status = 'Rejected';
        break;

      // Add other event types as needed
    }

    console.log('[RequestAggregate] State after applying event:', this.state);
    console.log('[RequestAggregate] ChangeRequests after applying event:', this.changeRequests);
  }

  static create(command) {
    console.log('[RequestAggregate] Creating RequestRaisedEvent with requestId:', command.requestId);

    return RequestRaisedEvent({
      requestId: command.requestId,
      changeRequestId: command.changeRequestId,
      versionId: 1,
      customerId: command.customerId,
      requestDetails: command.requestDetails,
      status: 'Pending'
    });
  }

  raiseChangeRequest(command) {
    if (!this.state) {
      throw new Error('Request state is not initialized.');
    }
    if (this.state.status === 'Closed') {
      throw new Error('Cannot raise change request on closed request');
    }

    return ChangeRequestRaisedEvent({
      changeRequestId: command.changeRequestId,
      requestId: this.state.requestId,
      changedByUserId: command.changedByUserId,
      description: command.description
    });
  }

  rejectChangeRequest(command) {
    return ChangeRequestRejectedDueToClosedRequest({
      changeRequestId: command.changeRequestId,
      requestId: this.state.requestId,
      reason: command.reason
    });
  }

  ensureChangeRequestAllowed() {
    if (!this.state) {
      throw new Error('Request state is not initialized.');
    }

    console.log(`[ensureChangeRequestAllowed] Current request status: ${this.state.status}`);
    if (this.state.status === 'Closed') {
      console.log('[ensureChangeRequestAllowed] Request is closed. No change request is accepted.');
      throw new Error('Request is already closed. No change request is accepted');
    }
    console.log('[ensureChangeRequestAllowed] Change request is allowed.');
  }

  close(command) {
    if (!this.state) {
      throw new Error(`Request ${command.requestId} not found`);
    }
    if (this.state.status === 'Closed') {
      throw new Error(`Request ${command.requestId} is already closed`);
    }

    return RequestClosedEvent(command.requestId, command.closedByUserId);
  }
}

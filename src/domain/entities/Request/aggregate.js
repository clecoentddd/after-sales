import { RequestCreatedEvent } from "../../events/requestCreatedEvent";
import { RequestClosedEvent } from "../../events/requestClosedEvent";

export class RequestAggregate {
  constructor() {
    this.state = null;
  }

  replay(events) {
    console.log('[RequestAggregate] Replaying events to rebuild state...');
    for (const event of events) {
      this.apply(event);
    }
    console.log('[RequestAggregate] State after replay:', this.state);
  }

  apply(event) {
    console.log('[RequestAggregate] Applying event of type:', event.type);
    switch (event.type) {
      case 'RequestCreated':
        this.state = {
          requestId: event.data.requestId,
          customerId: event.data.customerId,
          requestDetails: event.data.requestDetails,
          status: 'Pending',
        };
        break;
      case 'RequestClosed':
        if (this.state) {
          this.state.status = 'Closed';
        }
        break;
      // Handle other event types as needed
    }
    console.log('[RequestAggregate] State after applying event:', this.state);
  }

  static create(command) {
    console.log('[RequestAggregate] Creating RequestCreatedEvent with requestId:', command.requestId);
    return RequestCreatedEvent(
      command.requestId,
      command.customerId,
      command.requestDetails,
      'Pending'
    );
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

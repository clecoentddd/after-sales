import { RequestCreatedEvent } from "../../events/requestCreatedEvent";

export class RequestAggregate {
  constructor() {
    this.state = null;
  }

  replay(events) {
    for (const event of events) {
      this.apply(event);
    }
  }

  apply(event) {
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
    }
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

  close(command) {
    if (!this.state) {
      throw new Error(`Request ${command.requestId} not found`);
    }

    if (this.state.status === 'Closed') {
      throw new Error(`Request ${command.requestId} is already closed`);
    }

    return {
      type: 'RequestClosed',
      data: {
        requestId: command.requestId,
        closedByUserId: command.closedByUserId,
        closedAt: new Date().toISOString(),
      },
    };
  }
}

import { v4 as uuidv4 } from 'uuid';
import { CustomerCreatedEvent } from './events';

export class CustomerAggregate {
  static create(command) {
    return CustomerCreatedEvent(
      uuidv4(), // customerId
      command.name,
      command.organizationId
    );
  }
}
import { CustomerCreatedEvent } from '../../events/customerCreatedEvent';

export class CustomerAggregate {
  static create(command) {
    if (typeof command.name !== 'string' || command.name.trim().length < 2) {
      throw new Error('Customer name must be at least 2 characters.');
    }

    return CustomerCreatedEvent(
      command.customerId,
      command.name.trim(),
      command.organizationId
    );
  }
}

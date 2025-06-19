import { v4 as uuidv4 } from 'uuid';
import { OrganizationCreatedEvent } from './events';

export class OrganizationAggregate {
  static create(command) {
    return OrganizationCreatedEvent(
      uuidv4(), // organizationId
      command.name
    );
  }
}
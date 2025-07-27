import { CreateCustomerCommand } from './commands';
import { CustomerAggregate } from '../../entities/Customer/aggregate';
import { customerEventStore } from '../../core/eventStore';
import { eventBus } from '../../core/eventBus';
import { v4 as uuidv4 } from 'uuid';

export const createCustomerCommandHandler = {
  handle(command) {
    console.log(`[CustomerCommandHandler] Creating customer: ${command.name}`);
    console.log(`[CustomerCommandHandler] Based on organization: ${command.organizationId}`);

    const customerId = uuidv4();
    const createCommand = CreateCustomerCommand(customerId, command.name, command.organizationId);

    try {
      const event = CustomerAggregate.create(createCommand);
      customerEventStore.append(event);
      eventBus.publish(event);
      return { success: true, event };
    } catch (error) {
      console.warn(`[CustomerCommandHandler] Failed to create customer: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
};

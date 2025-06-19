import { eventBus } from '../../core/eventBus';
import { customerEventStore } from '../../core/eventStore';
import { CustomerAggregate } from './aggregate';

export const customerCommandHandler = {
  handle(command) {
    switch (command.type) {
      case 'CreateCustomer':
        const event = CustomerAggregate.create(command);
        customerEventStore.append(event);
        eventBus.publish(event);
        return { success: true, event };

      default:
        console.warn(`Unknown command type: ${command.type}`);
        return { success: false };
    }
  }
};
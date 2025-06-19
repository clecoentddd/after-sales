import { eventBus } from '../../core/eventBus';
import { organizationEventStore } from '../../core/eventStore';
import { OrganizationAggregate } from './aggregate';

export const organizationCommandHandler = {
  handle(command) {
    switch (command.type) {
      case 'CreateOrganization':
        const event = OrganizationAggregate.create(command);
        organizationEventStore.append(event);
        eventBus.publish(event);
        return { success: true, event };

      default:
        console.warn(`Unknown command type: ${command.type}`);
        return { success: false };
    }
  }
};
import { CreateOrganizationCommand } from './commands';
import { OrganizationAggregate } from '@entities/Organization/aggregate';
import { organizationEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';
import { v4 as uuidv4 } from 'uuid';

export const organizationCommandHandler = {
  handle(name) {
    console.log(`[OrganizationCommandHandler] Handling creation of: ${name}`);

    const organizationId = uuidv4();
    const command = CreateOrganizationCommand(organizationId, name);

    const event = OrganizationAggregate.create(command);
    organizationEventStore.append(event);
    eventBus.publish(event);

    return { success: true, event };
  }
};
import { CreateorganizationCommand } from './commands';
import { organizationAggregate } from '@entities/Organization/aggregate';
import { organizationEventStore } from '@core/eventStore';
import { eventBus } from '@core/eventBus';
import { v4 as uuidv4 } from 'uuid';

export const organizationCommandHandler = {
  handle(name) {
    console.log(`[organizationCommandHandler] Handling creation of: ${name}`);

    const organizationId = uuidv4();
    const command = CreateorganizationCommand(organizationId, name);

    const event = organizationAggregate.create(command);
    organizationEventStore.append(event);
    eventBus.publish(event);

    return { success: true, event };
  }
};
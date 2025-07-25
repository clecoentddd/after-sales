import { v4 as uuidv4 } from 'uuid'; // If you need to generate IDs here
import { eventBus } from '../../core/eventBus';
import { requestEventStore } from '../../core/eventStore'; // Event for change request goes here
import { ChangeRequestAggregate } from './aggregate';

export const changeRequestCommandHandler = {
  handle(command) {
    console.log(`[ChangeRequestCommandHandler] Handling command: ${command.type}`, command);

    switch (command.type) {
      case 'ChangeRequestRaised':
        // Optionally generate a changeRequestId if not present
        const changeRequestId = command.changeRequestId || uuidv4();

        // Include the changeRequestId in the command passed to the aggregate
        const event = ChangeRequestAggregate.raiseChangeRequest({
          ...command,
          changeRequestId,
        });

        requestEventStore.append(event);
        eventBus.publish(event);

        // Return success and changeRequestId for downstream use
        return { success: true, event, changeRequestId };

      default:
        console.warn(`[ChangeRequestCommandHandler] Unknown command type: ${command.type}`);
        return { success: false };
    }
  }
};

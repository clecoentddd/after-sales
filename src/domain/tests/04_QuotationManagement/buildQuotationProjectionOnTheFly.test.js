import { eventBus } from '@core/eventBus';
import {
  initializeQuotationProjectionEventHandler,
  clearQuotationsProjectionDB,
  queryQuotationsProjection,
} from '../../features/00_QuotationManagement/08_QuotationListProjection/QuotationProjectionHandler';
import { QuotationCreatedEvent } from '../../events/quotationCreatedEvent'; // Adjust the import path as necessary
import { QuotationApprovedEvent } from '../../events/quotationApprovedEvent'; // Adjust the import path as necessary

describe('QuotationProjectionHandler', () => {
  beforeEach(() => {
    clearQuotationsProjectionDB();
    initializeQuotationProjectionEventHandler();
  });

  it('should add new quotations on QuotationCreated events and update status on QuotationApproved', () => {
    // Use the imported QuotationCreatedEvent function to create the event
    const quotationCreatedEvent = QuotationCreatedEvent({
      quotationId: 'q1',
      requestId: 'r1',
      changeRequestId: 'cr1',
      customerId: 'c1', // Provide necessary values
      quotationDetails: {}, // Provide necessary values
    });

    // Use the imported QuotationApprovedEvent function to create the event
    const quotationApprovedEvent = QuotationApprovedEvent({
      quotationId: 'q1',
      requestId: 'r1',
      changeRequestId: 'cr1',
      approvedByUserId: 'user1', // Provide necessary values
    });

    // Publish create event
    eventBus.publish(quotationCreatedEvent);
    let quotations = queryQuotationsProjection();
    expect(quotations).toHaveLength(1);
    expect(quotations[0]).toMatchObject({
      quotationId: 'q1',
      status: 'Draft',
      requestId: 'r1',
      changeRequestId: 'cr1',
    });

    // Publish approve event
    eventBus.publish(quotationApprovedEvent);
    quotations = queryQuotationsProjection();
    expect(quotations).toHaveLength(1);
    expect(quotations[0]).toMatchObject({
      quotationId: 'q1',
      status: 'Approved',
    });
  });
});

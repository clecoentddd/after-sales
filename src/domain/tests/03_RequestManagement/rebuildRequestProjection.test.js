// tests/rebuildRequestProjection.test.js
import { requestEventStore } from '@core/eventStore';
import { rebuildRequestProjection } from '../../features/03_RequestManagement/shared/rebuildRequestProjection';
import {
  clearRequests,
  queryRequestsProjection
} from '../../features/03_RequestManagement/shared/requestProjectionDB';
import { RequestClosedEvent } from '../../events/requestClosedEvent';
import { RequestRaisedEvent } from '../../events/requestRaisedEvent';

describe('rebuildRequestProjection', () => {
  beforeEach(() => {
    requestEventStore.clear();
    clearRequests();
  });

  it('should rebuild projection with correct statuses and titles', async () => {
    // Arrange — use the exported event creators
    const e1 = RequestRaisedEvent({
      requestId: '01',
      changeRequestId: null,
      versionId: 1,
      customerId: 'C1',
      requestDetails: { title: 'First Request', description: 'First description' },
      status: 'Pending'
    });

    const e2 = RequestRaisedEvent({
      requestId: '02',
      changeRequestId: null,
      versionId: 1,
      customerId: 'C2',
      requestDetails: { title: 'Second Request', description: 'Second description' },
      status: 'Pending'
    });

    const e3 = RequestClosedEvent('01');

    requestEventStore.append(e1);
    requestEventStore.append(e2);
    requestEventStore.append(e3);

    // Act
    await rebuildRequestProjection();

    const projection = queryRequestsProjection();

    // Assert
    expect(projection).toHaveLength(2);

    const req1 = projection.find(r => r.requestId === '01');
    const req2 = projection.find(r => r.requestId === '02');

    console.log('Projection:', projection);

    expect(req1).toBeDefined();
    expect(req1.status).toBe('Closed');
    expect(req1.title).toBe('First Request'); // Check for the title

    expect(req2).toBeDefined();
    expect(req2.status).toBe('Pending');
    expect(req2.title).toBe('Second Request'); // Check for the title
  });
});

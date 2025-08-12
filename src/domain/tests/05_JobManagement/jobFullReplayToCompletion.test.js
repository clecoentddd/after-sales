// src/hooks/repairJobProjection.test.js
import { useRepairJobSlice } from '../../features/05_JobManagement/RepairJobListProjection/useRepairJobSlice.js';

describe('Repair job projection replay', () => {
  it('should produce Completed status after replaying events', () => {
    const events = [
      {
        type: 'JobCreated',
        data: {
          jobId: '22eb20d0-9dd4-4115-997c-8a0f5ec1a194',
          quotationId: 'd9ed9727-983a-4f0d-a2b0-ce4c56e7c1f2',
          requestId: '4b5e02b8-070d-4f0e-9be7-ee1ba35d7e22',
          changeRequestId: '0784afb0-1528-47f2-b0d0-fbd21b3756f8',
          details: {
            title: 'Repair Job for: REQ2',
            description: 'Initiated from approved quotation for request: No description',
            priority: 'Normal',
            assignedTeam: 'Unassigned'
          },
          status: 'Pending'
        },
        metadata: { timestamp: '2025-08-07T22:20:47.181Z' }
      },
      {
        type: 'JobStarted',
        data: {
          jobId: '22eb20d0-9dd4-4115-997c-8a0f5ec1a194',
          requestId: '4b5e02b8-070d-4f0e-9be7-ee1ba35d7e22',
          assignedTeam: 'Team_A',
          startedByUserId: 'user-alice-123',
          startedAt: '2025-08-07T22:21:14.504Z',
          status: 'Started'
        },
        metadata: { timestamp: '2025-08-07T22:21:14.504Z' }
      },
      {
        type: 'JobCompleted',
        data: {
          jobId: '22eb20d0-9dd4-4115-997c-8a0f5ec1a194',
          requestId: '4b5e02b8-070d-4f0e-9be7-ee1ba35d7e22',
          completedByUserId: 'user-alice-123',
          completionDetails: {
            notes: 'Job completed by user-alice-123 at 08.08.2025, 00:21:16'
          },
          completedAt: '2025-08-07T22:21:16.919Z',
          status: 'Completed'
        },
        metadata: { timestamp: '2025-08-07T22:21:16.919Z' }
      }
    ];

    const jobs = useRepairJobSlice(events);

    expect(jobs).toHaveLength(1);
    expect(jobs[0].status).toBe('Completed');
    expect(jobs[0].details.title).toBe('Repair Job for: REQ2');
    expect(jobs[0].details.assignedTeam).toBe('Team_A');
  });
});

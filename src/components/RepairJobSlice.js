import React, { useState } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { useRepairJobSlice } from '@features/05_JobManagement/RepairJobListProjection/useRepairJobSlice';
import { startJobCommandHandler } from '@features/05_JobManagement/0502_StartJob/commandHandler';
import { StartJobCommand } from '@features/05_JobManagement/0502_StartJob/commands';
import { completeJobCommandHandler } from '@features/05_JobManagement/0503_CompleteJob/commandHandler';
import { CompleteJobCommand } from '@features/05_JobManagement/0503_CompleteJob/commands';
import { RepairJobProjection } from '@features/05_JobManagement/RepairJobListProjection/rebuildProjection';
import { useJobEvents } from '@features/05_JobManagement/repairJobManagementStream';

function RepairJobSlice({ customers, requests, quotations, currentUserId }) {
  const { jobs, jobEvents } = useRepairJobSlice();
  const [selectedTeam, setSelectedTeam] = useState('Team_A');
  const [isRebuilding, setIsRebuilding] = useState(false);
  const { jobEvents: jobLogEvents } = useJobEvents();

  const handleRebuild = async () => {
    console.log('[RepairJobSlice] Rebuild button clicked');
    setIsRebuilding(true);

    try {
      // Optional: clear any local jobs state to show empty state
      // setJobs([]);

      // Optional delay to show empty state briefly
      await new Promise(resolve => setTimeout(resolve, 500));

      // Rebuild projection internally (UI does not pass events)
      const rebuiltJobs = await RepairJobProjection.rebuild();
      console.log('[RepairJobSlice] Projection rebuilt successfully', rebuiltJobs);

      // If you track local state, update it here
      // setJobs(rebuiltJobs);
    } catch (error) {
      console.error('[RepairJobSlice] Error rebuilding projection:', error);
    } finally {
      setIsRebuilding(false);
    }
  };

  const handleStartJob = (jobId) => {
    console.log('[RepairJobSlice] Attempting to start job:', jobId, 'with team:', selectedTeam);
    if (!jobId || !selectedTeam) {
      console.warn("Please select a team before starting the job.");
      return;
    }
    const jobToStart = jobs.find(job => job.jobId === jobId);
    if (!jobToStart) {
      console.warn(`Job with ID ${jobId} not found.`);
      return;
    }
    if (jobToStart.status !== 'Pending') {
      console.warn(`Job ${jobId} is already ${jobToStart.status}.`);
      return;
    }

    startJobCommandHandler.handle(
      StartJobCommand(jobToStart.jobId, selectedTeam, currentUserId)
    );

    console.log('[RepairJobSlice] StartJobCommand dispatched:', {
      jobId: jobToStart.jobId,
      selectedTeam,
      currentUserId
    });
  };

  const handleCompleteJob = (jobId) => {
    console.log('[RepairJobSlice] Attempting to complete job:', jobId);
    if (!jobId) return;

    const jobToComplete = jobs.find(job => job.jobId === jobId);
    if (!jobToComplete) {
      console.warn(`Job with ID ${jobId} not found.`);
      return;
    }
    if (jobToComplete.status !== 'Started') {
      console.warn(`Job ${jobId} cannot be completed as its status is ${jobToComplete.status}.`);
      return;
    }

    const completedByUserId = "manager-john-456";
    const completionDetails = {
      notes: `Cleaning & Polishing including for free`
    };

    const command = CompleteJobCommand(jobId, completedByUserId, completionDetails);
    completeJobCommandHandler.handle(command);

    console.log('[RepairJobSlice] CompleteJobCommand dispatched:', {
      jobId: command.jobId,
      completionDetails: command.completionDetails,
      completedByUserId: command.completedByUserId,
    });
  };

  React.useEffect(() => {
  console.log('[RepairJobSlice] jobLogEvents updated:', jobLogEvents);
}, [jobLogEvents]);

  const getButtonStyle = (status) => {
    const baseStyle = {
      padding: '8px 12px',
      margin: '4px 0',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
      width: '100%',
      textAlign: 'left',
      color: 'white'
    };

    if (status === 'Pending') {
      return { ...baseStyle, backgroundColor: '#4ECDC4' };
    } else if (status === 'Started') {
      return { ...baseStyle, backgroundColor: '#2ecc71' };
    }
    return baseStyle;
  };

  const actionableJobs = (jobs || []).filter(job => {
    return (job.status === 'Pending' || job.status === 'Started') && job.jobId;
  });

  return (
    <div className="aggregate-block">
      <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Repair Job Management
        <button
          onClick={handleRebuild}
          title="Rebuild Projection"
          disabled={isRebuilding}
          style={{
            background: 'none',
            border: 'none',
            cursor: isRebuilding ? 'not-allowed' : 'pointer',
            fontSize: '1.5rem',
            padding: 0,
            marginLeft: '1rem',
            color: isRebuilding ? '#aaa' : '#333'
          }}
        >
          🔄
        </button>
      </h2>
      <div className="aggregate-columns">
        <div className="aggregate-column first-column">
          <h3>Assign a team to start a job</h3>
          <p>Jobs are automatically created when a Quotation is Approved.</p>
          <div className="team-selection">
            <label htmlFor="team-select">Assign Team:</label>
            <select
              id="team-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="Team_A">Team A</option>
              <option value="Team_B">Team B</option>
              <option value="Team_C">Team C</option>
            </select>
          </div>
          <ul className="action-list">
            {actionableJobs.length > 0 ? (
              actionableJobs.map(job => (
                <li key={job.jobId}>
                  {job.status === 'Pending' && (
                    <button
                      onClick={() => handleStartJob(job.jobId)}
                      style={getButtonStyle(job.status)}
                    >
                      Start Job {job.jobDetails?.title?.slice(0, 80) || 'Untitled'}...
                    </button>
                  )}
                  {job.status === 'Started' && (
                    <button
                      onClick={() => handleCompleteJob(job.jobId)}
                      style={getButtonStyle(job.status)}
                    >
                      Complete Job {job.jobDetails?.title?.slice(0, 80) || 'Untitled'}...
                    </button>
                  )}
                  <small>Current Status: {job.status}</small>
                </li>
              ))
            ) : (
              <p>No jobs pending or started for actions.</p>
            )}
          </ul>
        </div>
        <div className="aggregate-column second-column">
          <ReadModelDisplay
            items={jobs}
            idKey="jobId"
            renderDetails={(job) => {
              const request = Array.isArray(requests) ? requests.find(r => r.requestId === job.requestId) : null;
              const quotation = quotations.find(q => q.quotationId === job.quotationId);
              return (
                <>
                  <strong>{job.jobDetails?.title || 'Untitled'}</strong>
                  <small>
                    From Request: {request ? request.requestDetails?.title?.slice(0, 20) : 'N/A'}... <br />
                    From Quotation: {quotation?.quotationId?.slice(0, 20) || 'N/A'}... <br />
                    Status: {job.status} {job.jobDetails?.assignedTeam && `(${job.jobDetails.assignedTeam})`}
                  </small>
                </>
              );
            }}
          />
        </div>
        <div className="aggregate-column third-column">
          <EventLogDisplay events={jobLogEvents} />
        </div>
      </div>
    </div>
  );
}

export default RepairJobSlice;

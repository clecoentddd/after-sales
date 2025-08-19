import React, { useState } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { useRepairJobSlice } from '@features/05_JobManagement/RepairJobListProjection/useRepairJobSlice';
import { startJobCommandHandler } from '@features/05_JobManagement/0503_StartJob/commandHandler';
import { StartJobCommand } from '@features/05_JobManagement/0503_StartJob/commands';
import { completeJobCommandHandler } from '@features/05_JobManagement/0505_CompleteJob/commandHandler';
import { CompleteJobCommand } from '@features/05_JobManagement/0505_CompleteJob/commands';
import { useJobEvents } from '@features/05_JobManagement/repairJobManagementStream';

function RepairJobSlice({ customers, requests, quotations, currentUserId }) {
  const { jobs, rebuildProjection } = useRepairJobSlice();
  const [selectedTeam, setSelectedTeam] = useState('Team_A');
  const [isRebuilding, setIsRebuilding] = useState(false);
  const { jobEvents: jobLogEvents } = useJobEvents();

  // Log the current jobs array on every render
  console.log('[RepairJobSlice] Render - Current jobs:', jobs);

  const handleRebuild = async () => {
    console.log('[RepairJobSlice] Rebuild button clicked. Current jobs before rebuild:', jobs);
    setIsRebuilding(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      await rebuildProjection();
      console.log('[RepairJobSlice] Projection rebuilt successfully');
    } catch (error) {
      console.error('[RepairJobSlice] Error rebuilding projection:', error);
    } finally {
      setIsRebuilding(false);
    }
  };

  const handleStartJob = (jobId) => {
    console.log('[RepairJobSlice] Attempting to start job:', jobId, 'with team:', selectedTeam);
    console.log('[RepairJobSlice] Current jobs array:', jobs);

    if (!jobId || !selectedTeam) {
      console.warn("[RepairJobSlice] Please select a team before starting the job.");
      return;
    }

    const jobToStart = jobs.find(job => job.jobId === jobId);
    console.log('[RepairJobSlice] Found job to start:', jobToStart);

    if (!jobToStart) {
      console.warn(`[RepairJobSlice] Job with ID ${jobId} not found in current jobs:`, jobs);
      return;
    }

    if (jobToStart.status !== 'Pending') {
      console.warn(`[RepairJobSlice] Job ${jobId} is already ${jobToStart.status}.`);
      return;
    }

    console.log('[RepairJobSlice] Starting job with details:', {
      jobId: jobToStart.jobId,
      title: jobToStart.jobDetails?.title,
      status: jobToStart.status,
      requestId: jobToStart.requestId
    });

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
    console.log('[RepairJobSlice] Current jobs array:', jobs);

    if (!jobId) {
      console.warn('[RepairJobSlice] No jobId provided');
      return;
    }

    const jobToComplete = jobs.find(job => job.jobId === jobId);
    console.log('[RepairJobSlice] Found job to complete:', jobToComplete);
    console.log('[RepairJobSlice] All started jobs:', jobs.filter(job => job.status === 'Started'));

    if (!jobToComplete) {
      console.warn(`[RepairJobSlice] Job with ID ${jobId} not found in current jobs:`, jobs);
      return;
    }

    if (jobToComplete.status !== 'Started') {
      console.warn(`[RepairJobSlice] Job ${jobId} cannot be completed as its status is ${jobToComplete.status}.`);
      return;
    }

    const completedByUserId = "manager-john-456";
    const completionDetails = {
      notes: `Cleaning & Polishing including for free`
    };

    console.log('[RepairJobSlice] Completing job with details:', {
      jobId: jobToComplete.jobId,
      title: jobToComplete.jobDetails?.title,
      status: jobToComplete.status,
      requestId: jobToComplete.requestId
    });

    const command = CompleteJobCommand(jobId, completedByUserId, completionDetails);
    console.log('[RepairJobSlice] Created CompleteJobCommand:', {
      jobId: command.jobId,
      completionDetails: command.completionDetails,
      completedByUserId: command.completedByUserId,
    });

    completeJobCommandHandler.handle(command);
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

  // Debug the actionable jobs filtering
  const actionableJobs = (jobs || []).filter(job => {
    const isActionable = (job.status === 'Pending' || job.status === 'Started') && job.jobId;
    console.log(`[RepairJobSlice] Filtering job ${job.jobId}: status=${job.status}, actionable=${isActionable}`);
    return isActionable;
  });

  // Log when no actionable jobs are found
  if (actionableJobs.length === 0) {
    console.log('[RepairJobSlice] No actionable jobs found. Full jobs array:', jobs);
  } else {
    console.log('[RepairJobSlice] Found actionable jobs:', actionableJobs.map(j => ({
      jobId: j.jobId,
      status: j.status,
      title: j.jobDetails?.title?.slice(0, 30)
    })));
  }

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
              actionableJobs.map(job => {
                console.log(`[RepairJobSlice] Rendering actionable job ${job.jobId} with status ${job.status}`);
                return (
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
                        onClick={() => {
                          console.log(`[RepairJobSlice] Complete button clicked for job ${job.jobId}`);
                          handleCompleteJob(job.jobId)
                        }}
                        style={getButtonStyle(job.status)}
                      >
                        Complete Job {job.jobDetails?.title?.slice(0, 80) || 'Untitled'}...
                      </button>
                    )}
                    <small>Current Status: {job.status}</small>
                    <br />
                    <small>Job ID: {job.jobId}</small>
                  </li>
                );
              })
            ) : (
              <p>No jobs pending or started for actions.</p>
            )}
          </ul>
        </div>
        <div className="aggregate-column second-column">
          {console.log('[RepairJobSlice] Passing to ReadModelDisplay:', jobs.map(j => ({
            jobId: j.jobId,
            status: j.status,
            title: j.jobDetails?.title?.slice(0, 30)
          })))}
          <ReadModelDisplay
            items={jobs}
            idKey="jobId"
            renderDetails={(job) => {
              console.log(`[RepairJobSlice] ReadModelDisplay rendering job ${job.jobId} with status ${job.status}`);
              const request = Array.isArray(requests) ? requests.find(r => r.requestId === job.requestId) : null;
              const quotation = quotations.find(q => q.quotationId === job.quotationId);
              return (
                <>
                  <strong>{job.jobDetails?.title || 'Untitled'}</strong>
                  <small>
                    Job ID: {job.jobId}<br />
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

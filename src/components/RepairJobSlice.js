import React, { useState } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { startJobCommandHandler } from '../domain/features/00_JobManagement/13_ StartJob/commandHandler';
import { StartJobCommand } from '../domain/features/00_JobManagement/13_ StartJob/commands';
import { completeJobCommandHandler } from '../domain/features/00_JobManagement/15_CompleteJob/commandHandler';
import { CompleteJobCommand } from '../domain/features/00_JobManagement/15_CompleteJob/commands';

function RepairJobSlice({ jobs, jobEvents, customers, requests, quotations, currentUserId }) {
  const [selectedTeam, setSelectedTeam] = useState('Team_A'); // Default team

  const handleStartJob = (jobId) => {
    console.log('[RepairJobSlice] Attempting to start job:', jobId, 'with team:', selectedTeam);
    if (!jobId || !selectedTeam) {
      console.warn("Please select a team before starting the job.");
      return;
    }

    const jobToStart = jobs.find(job => job.jobId === jobId);
    console.log('[RepairJobSlice] Job to start:', jobToStart);

    if (!jobToStart) {
      console.warn(`Job with ID ${jobId} not found.`);
      return;
    }

    if (jobToStart.status !== 'Pending') {
      console.warn(`Job ${jobId} is already ${jobToStart.status}.`);
      return;
    }

    startJobCommandHandler.handle(
      StartJobCommand(
        jobToStart.jobId,
        jobToStart.requestId,
        selectedTeam,
        currentUserId
      )
    );

    console.log('[RepairJobSlice] StartJobCommand dispatched:', {
      jobId: jobToStart.jobId,
      requestId: jobToStart.requestId,
      selectedTeam,
      currentUserId
    });
  };

  const handleCompleteJob = (jobId) => {
    console.log('[RepairJobSlice] Attempting to complete job:', jobId);
    if (!jobId) return;

    const jobToComplete = jobs.find(job => job.jobId === jobId);
    console.log('[RepairJobSlice] Job to complete:', jobToComplete);

    if (!jobToComplete) {
      console.warn(`Job with ID ${jobId} not found.`);
      return;
    }

    if (jobToComplete.status !== 'Started') {
      console.warn(`Job ${jobId} cannot be completed as its status is ${jobToComplete.status}. Only 'Started' jobs can be completed.`);
      return;
    }

    completeJobCommandHandler.handle(
      CompleteJobCommand(
        jobToComplete.jobId,
        jobToComplete.requestId,
        jobToComplete.changeRequestId,
        currentUserId,
        {
          notes: `Job completed by ${currentUserId} at ${new Date().toLocaleString()}`
        }
      )
    );

    console.log('[RepairJobSlice] CompleteJobCommand dispatched:', {
      jobId: jobToComplete.jobId,
      requestId: jobToComplete.requestId,
      currentUserId
    });
  };

  // Detailed logs for debugging
  console.log('[RepairJobSlice] Render with jobs:', jobs);

  if (jobs) {
    jobs.forEach(job => {
      console.log(
        `[RepairJobSlice] Job ID: ${job.jobId}, Status: "${job.status}", Title: "${job.jobDetails?.title}", Assigned Team: "${job.jobDetails?.assignedTeam || 'None'}"`
      );
    });
  } else {
    console.warn('[RepairJobSlice] jobs is undefined or null');
  }

  console.log('[RepairJobSlice] Render with jobEvents:', jobEvents);

  const actionableJobs = (jobs || []).filter(job => {
    const isActionable = job.status === 'Pending' || job.status === 'Started';
    console.log(`[RepairJobSlice] Filtering job ${job.jobId}: status=${job.status}, actionable=${isActionable}`);
    return isActionable && job.jobId; // Ensure jobId exists
  });

  console.log('[RepairJobSlice] Jobs filtered for actions:', actionableJobs);

  return (
    <div className="aggregate-block">
      <h2>Repair Job Management</h2>
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
                      className="start-button"
                    >
                      Start Job {job.jobDetails?.title ? job.jobDetails.title.slice(0, 80) : 'Untitled'}...
                    </button>
                  )}
                  {job.status === 'Started' && (
                    <button
                      onClick={() => handleCompleteJob(job.jobId)}
                      className="complete-button"
                    >
                      Complete Job {job.jobDetails?.title ? job.jobDetails.title.slice(0, 80) : 'Untitled'}...
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
              const customer = customers.find(c => c.customerId === job.customerId);
              const request = requests.find(r => r.requestId === job.requestId);
              const quotation = quotations.find(q => q.quotationId === job.quotationId);
              return (
                <>
                  <strong>{job.jobDetails?.title || 'Untitled'}</strong>
                  <small>
                    For: {customer?.name || 'Unknown Customer'} <br />
                    From Request: {request?.requestDetails?.title?.slice(0, 20) || 'N/A'}... <br />
                    From Quotation: {quotation?.quotationDetails?.title?.slice(0, 20) || 'N/A'}... <br />
                    Status: {job.status} {job.jobDetails?.assignedTeam && `(${job.jobDetails.assignedTeam})`}
                  </small>
                </>
              );
            }}
          />
        </div>
        <div className="aggregate-column third-column">
          <EventLogDisplay events={jobEvents} />
        </div>
      </div>
    </div>
  );
}

export default RepairJobSlice;


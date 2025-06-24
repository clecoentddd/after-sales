import React, { useState } from 'react';
import ReadModelDisplay from './ReadModelDisplay';
import EventLogDisplay from './EventLogDisplay';
import { startJobCommandHandler } from '../domain/features/startJob/commandHandler';
import { StartJobCommand } from '../domain/features/startJob/commands';
import { completeJobCommandHandler } from '../domain/features/completeJob/commandHandler';
import { CompleteJobCommand } from '../domain/features/completeJob/commands';

function RepairJobSlice({ jobs, jobEvents, customers, requests, quotations, currentUserId }) {
  const [selectedTeam, setSelectedTeam] = useState('Team_A'); // Default team

  const handleStartJob = (jobId) => {
    if (!jobId || !selectedTeam) {
        console.warn("Please select a team before starting the job.");
        return;
    }

    const jobToStart = jobs.find(job => job.jobId === jobId);
    if (jobToStart && jobToStart.status !== 'Pending') {
      console.warn(`Job ${jobId} is already ${jobToStart.status}.`);
      return;
    }

    startJobCommandHandler.handle( 
      StartJobCommand(
        jobId,
        selectedTeam,
        currentUserId 
      )
    );
  };

  const handleCompleteJob = (jobId) => {
    if (!jobId) return;

    const jobToComplete = jobs.find(job => job.jobId === jobId);
    if (jobToComplete && jobToComplete.status !== 'Started') {
      console.warn(`Job ${jobId} cannot be completed as its status is ${jobToComplete.status}. Only 'Started' jobs can be completed.`);
      return;
    }

    completeJobCommandHandler.handle(
      CompleteJobCommand(
        jobId,
        currentUserId, 
        { notes: `Job completed by ${currentUserId} at ${new Date().toLocaleString()}` } 
      )
    );
  };

  return (
  <div className="aggregate-block">
    <h2>Repair Job Aggregate</h2>
    <div className="aggregate-columns">

      <div className="aggregate-column first-column">
        <h3>Assign a team to start a job</h3>
        <p>Jobs are automatically created when a Quote is Approved.</p>
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
          {jobs
            .filter(job => job.status === 'Pending' || job.status === 'Started')
            .map(job => (
              <li key={job.jobId}>
                {job.status === 'Pending' && (
                  <button
                    onClick={() => handleStartJob(job.jobId)}
                    className="start-button"
                  >
                    Start Job {job.jobDetails.title.slice(0, 30)}...
                  </button>
                )}
                {job.status === 'Started' && (
                  <button
                    onClick={() => handleCompleteJob(job.jobId)}
                    className="complete-button"
                  >
                    Complete Job {job.jobDetails.title.slice(0, 30)}...
                  </button>
                )}
                <small>Current Status: {job.status}</small>
              </li>
            ))}
          {jobs.filter(job => job.status === 'Pending' || job.status === 'Started').length === 0 && (
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
            const quote = quotations.find(q => q.quotationId === job.quoteId);
            return (
              <>
                <strong>{job.jobDetails.title}</strong>
                <small>
                  For: {customer?.name || 'Unknown Customer'} <br />
                  From Request: {request?.requestDetails.title.slice(0, 20)}... <br />
                  From Quote: {quote?.quotationDetails.title.slice(0, 20)}... <br />
                  Status: {job.status} {job.jobDetails.assignedTeam && `(${job.jobDetails.assignedTeam})`}
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

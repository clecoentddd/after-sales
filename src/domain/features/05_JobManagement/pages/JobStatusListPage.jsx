import React from "react";
import "./JobStatusListPage.css";
import { JobCreatedProjection } from "../0502_JobCreatedProjection/JobCreatedProjection";
import { JobStartedProjection } from "../0504_StartedJobProjection/JobStartedProjection";
import { JobCompletedProjection } from "../0506_CompletedJobProjection/JobCompletedProjection";
import { useProjection } from "../hooks/useHooks";
import { rebuildProjections } from "../services/projectionRebuilder";

export default function JobStatusListPage() {
  const created = useProjection(JobCreatedProjection);
  const started = useProjection(JobStartedProjection);
  const completed = useProjection(JobCompletedProjection);

  return (
    <div className="job-status-page">
      <h1>Job Status List</h1>
      <div className="job-toolbar">
        <button
          onClick={() => rebuildProjections([
            JobCreatedProjection,
            JobStartedProjection,
            JobCompletedProjection
          ])}
          className="btn-rebuild"
        >
          Emergency Rebuild All (Service Restart Only)
        </button>
      </div>
      <div className="job-grid">
        <ProjectionBlock title="Created Jobs" jobs={created.jobs} />
        <ProjectionBlock title="Started Jobs" jobs={started.jobs} />
        <ProjectionBlock title="Completed Jobs" jobs={completed.jobs} />
      </div>
    </div>
  );
}

function ProjectionBlock({ title, jobs }) {
  return (
    <div className="job-block">
      <h2>{title}</h2>
      {jobs.length === 0 ? (
        <p className="job-meta">No jobs</p>
      ) : (
        <ul className="job-list">
          {jobs.map((job) => (
            <li key={job.jobId}>
              <span className="job-id">{job.jobId}</span>
              <div className="job-meta">requestId: {job.requestId}</div>
              <div className="job-meta">Status: {job.status}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

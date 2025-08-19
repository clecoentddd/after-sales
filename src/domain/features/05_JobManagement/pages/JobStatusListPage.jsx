// src/domain/features/05_JobManagement/pages/JobStatusListPage.jsx
import React from "react";
import "./JobStatusListPage.css";
import { JobCreatedProjection } from "../0502_JobCreatedProjection/JobCreatedProjection";
import { JobStartedProjection } from "../0504_StartedJobProjection/JobStartedProjection";
import { JobCompletedProjection } from "../0506_CompletedJobProjection/JobCompletedProjection";
import { useProjection } from "../hooks/useProjection";

export default function JobStatusListPage() {
  const created = useProjection(JobCreatedProjection);
  const started = useProjection(JobStartedProjection);
  const completed = useProjection(JobCompletedProjection);

  const rebuildAll = async () => {
    await Promise.all([
      created.rebuildProjection(),
      started.rebuildProjection(),
      completed.rebuildProjection()
    ]);
  };

  return (
    <div className="job-status-page">
      <h1>Job Status List</h1>

      <div className="job-toolbar">
        <button onClick={created.rebuildProjection} className="btn-created">Rebuild Created</button>
        <button onClick={started.rebuildProjection} className="btn-started">Rebuild Started</button>
        <button onClick={completed.rebuildProjection} className="btn-completed">Rebuild Completed</button>
        <button onClick={rebuildAll} className="btn-all">Rebuild All</button>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
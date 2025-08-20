// sharedJobStorage.js
let jobs = {};

export const jobStorage = {
  getAll: () => Object.values(jobs),
  getById: (jobId) => jobs[jobId],
  upsert: (job) => {
    jobs[job.jobId] = { ...jobs[job.jobId], ...job };
    return jobs[job.jobId];
  },
  reset: () => {
    jobs = {};
  },
  // Add method to update job status
  updateStatus: (jobId, status, timestamp) => {
    if (jobs[jobId]) {
      jobs[jobId] = {
        ...jobs[jobId],
        status,
        [`${status.toLowerCase()}At`]: timestamp
      };
    }
    return jobs[jobId];
  }
};

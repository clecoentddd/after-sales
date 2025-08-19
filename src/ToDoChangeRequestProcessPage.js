import React, { useState, useEffect } from 'react';
import { getChangeRequestTodoList, buildTodoList } from '@domain/features/05_JobManagement/0552_ToDoCreatedJobChangeRequestProjection/toDoChangeRequestList';
import './ToDoListPage.css';

function ToDoListPage() {
  const [todoList, setTodoList] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    refreshTodoList();
  }, []);

  const refreshTodoList = () => {
    buildTodoList();
    setTodoList(getChangeRequestTodoList());
  };

  const toggleRowExpansion = (changeRequestId) => {
    setExpandedRows(prev => ({
      ...prev,
      [changeRequestId]: !prev[changeRequestId],
    }));
  };

  const renderValue = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return <pre>{JSON.stringify(val, null, 2)}</pre>;
    return val;
  };

  const renderJobId = (job) => {
  if (Array.isArray(job) && job.length > 0) {
    return job[0].jobId;
  }
  return typeof job === 'string' ? job : '';
};

  return (
    <div className="todo-column">
      <div className="todo-header">
        <h2>Change Request To-Do List</h2>
        <button onClick={refreshTodoList} className="refresh-button">
          Refresh
        </button>
      </div>
      <table className="todo-table">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Change Request ID</th>
            <th>Job ID</th>
            <th>Assignment Status</th>
            <th>Process Status</th>
            <th>Latest Timestamp</th>
            <th>Events</th>
          </tr>
        </thead>
        <tbody>
          {todoList.length === 0 ? (
            <tr>
              <td colSpan="7">No change requests found.</td>
            </tr>
          ) : (
            todoList.map((row) => (
              <React.Fragment key={row.changeRequestId}>
                <tr className="todo-row">
                  <td>{renderValue(row.requestId)}</td>
                  <td>{renderValue(row.changeRequestId)}</td>
                  <td>{renderJobId(row.jobId)}</td>
                  <td>{renderValue(row.assignmentStatus)}</td>
                  <td>{renderValue(row.processStatus)}</td>
                  <td>{row.timestamp ? new Date(row.timestamp).toLocaleString() : ''}</td>
                  <td>
                    <button
                      onClick={() => toggleRowExpansion(row.changeRequestId)}
                      className="expand-button"
                    >
                      {expandedRows[row.changeRequestId] ? '▲' : '▼'}
                    </button>
                  </td>
                </tr>

                {expandedRows[row.changeRequestId] && (
                  <tr className="event-details">
                    <td colSpan="7">
                      <div className="events-list">
                        {Array.isArray(row.events) && row.events.map((event, index) => (
                          <div key={index} className="event-item">
                            <strong>{renderValue(event.type)}</strong>:
                            {Object.entries(event).map(([key, value]) => {
                              if (key === 'type' || key === 'timestamp') return null; // already displayed
                              return (
                                <div key={key}>
                                  <strong>{key}:</strong> {renderValue(value)}
                                </div>
                              );
                            })}
                            <small className="event-timestamp">
                              {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                            </small>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ToDoListPage;

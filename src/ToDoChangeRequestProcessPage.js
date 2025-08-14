import React, { useState, useEffect } from 'react';
import { getChangeRequestTodoList, buildTodoList } from '@domain/features/05_JobManagement/91_ToDoChangeRequestProjection/toDoChangeRequestList';
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
            <th>Assignment Status</th>
            <th>Process Status</th> {/* <-- New column */}
            <th>Latest Timestamp</th>
            <th>Events</th>
          </tr>
        </thead>
        <tbody>
          {todoList.length === 0 ? (
            <tr>
              <td colSpan="6">No change requests found.</td>
            </tr>
          ) : (
            todoList.map((row) => (
              <React.Fragment key={row.changeRequestId}>
                <tr className="todo-row">
                  <td>{row.requestId}</td>
                  <td>{row.changeRequestId}</td>
                  <td>{row.assignmentStatus}</td>
                  <td>{row.processStatus}</td> {/* <-- Display new field */}
                  <td>{new Date(row.timestamp).toLocaleString()}</td>
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
                    <td colSpan="6">
                      <div className="events-list">
                        {row.events.map((event, index) => (
                          <div key={index} className="event-item">
                            <strong>{event.type}</strong>:
                            {event.type === 'ChangeRequestJobAssigned' && (
                              <> Assigned to job <code>{event.aggregateId}</code></>
                            )}
                            {event.type === 'ChangeRequestJobAssignmentFailed' && (
                              <> Failed: {event.data?.reason || 'No reason provided'}</>
                            )}
                            {event.type === 'ChangeRequestRaised' && (
                              <> Raised: {event.data?.description}</>
                            )}
                            {event.type === 'JobOnHold' && (
                              <> Job put on hold: {event.data?.reason}</>
                            )}
                            <small className="event-timestamp">
                              {new Date(event.timestamp).toLocaleString()}
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

import React, { useState, useEffect } from 'react';
import './ToDoListPage.css';
import { getToDoDB } from '@features/05_JobManagement/0521_ToDo_ChangeRequest_To_Assess/toDoDB';

function ToDoListPage() {
  const [todoList, setTodoList] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    refreshTodoList();
  }, []);

  const refreshTodoList = () => {
    setTodoList(getToDoDB());
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

  const renderFlag = (flag) => {
    const flagMap = {
      'todo': 'To Process',
      'processed': 'Processed'
    };
    return flagMap[flag] || flag;
  };

  const renderCRstatus = (CRstatus) => {
    if (!CRstatus) return '';
    const crstatusMap = {
      'pending_assessment': 'Pending Assessment',
      'rejected': 'Rejected',
      'on_hold': 'On Hold',
    };
    return crstatusMap[CRstatus] || CRstatus;
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
            <th>Change Request ID</th>
            <th>Job ID</th>
            <th>Status</th>
            <th>CR Status</th>
          </tr>
        </thead>
        <tbody>
          {todoList.length === 0 ? (
            <tr>
              <td colSpan="4">No change requests found.</td>
            </tr>
          ) : (
            todoList.map((row) => (
              <tr key={row.changeRequestId} className="todo-row">
                <td>{renderValue(row.changeRequestId)}</td>
                <td>{renderValue(row.jobId)}</td>
                <td>
                  <span className={`status-badge ${row.flag}`}>
                    {renderFlag(row.flag)}
                  </span>
                </td>
                <td>
                  {row.CRstatus && (
                    <span className={`crstatus-badge ${row.CRstatus}`}>
                      {renderCRstatus(row.CRstatus)}
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ToDoListPage;

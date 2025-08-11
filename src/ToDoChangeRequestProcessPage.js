import React from 'react';

import { getTodoList } from '@domain/features/05_JobManagement/99_ToDoChangeRequestProcessManager/todoListManager';
import './ToDoListPage.css'; // Import the CSS file

function ToDoListPage() {
  const todoList = getTodoList();
  return (
    <div className="todo-column">
      <h2>To-Do List</h2>
      <ul className="todo-list">
        {todoList.length === 0 ? (
          <li>No items found in the to-do list.</li>
        ) : (
          todoList.map((item, index) => (
            <li key={item.eventId || index} className="todo-item">
              <div><strong>Status:</strong> {item.track}</div>
              <div><strong>Job ID:</strong> {item.jobId || 'N/A'}</div>
              <div><strong>Change Request ID:</strong> {item.changeRequestId || 'N/A'}</div>
              <div><strong>Request ID:</strong> {item.requestId || 'N/A'}</div>
              <div><strong>User ID:</strong> {item.changedByUserId || 'N/A'}</div>
              <div><strong>Description:</strong> {item.description || 'No description'}</div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default ToDoListPage;

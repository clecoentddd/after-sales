import React from 'react';
import { getAllEvents } from './domain/core/eventStoreUtils'; // or wherever you put the helper function

function EventsPage() {
  const events = getAllEvents();

  return (
    <div className="aggregate-column">
      <h2>All Events (with source)</h2>
      <ul className="event-list">
        {events.length === 0 ? (
          <li>No events found.</li>
        ) : (
          events.map((event, index) => (
            <li key={event.eventId || index}>
              <div><strong>Type:</strong> {event.type}</div>
              <div><strong>Source:</strong> {event.source}</div>
              <div><strong>Time:</strong> {new Date(event.timestamp).toLocaleString()}</div>
              <pre>{JSON.stringify(event, null, 2)}</pre>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default EventsPage;

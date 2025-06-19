// src/components/EventLogDisplay.js
import React from 'react';

/**
 * Reusable component to display a log of events.
 * @param {object} props - Component properties.
 * @param {Array<object>} props.events - The array of event objects to display.
 */
const EventLogDisplay = ({ events }) => {
  return (
    <div className="aggregate-column">
      <h3>Events</h3>
      {events.length === 0 ? (
        <p>No events yet</p>
      ) : (
        <ul className="event-list">
          {events.map((event, i) => (
            <li key={event.eventId || i}> {/* Use event.eventId if available, otherwise index */}
              <div className="event-type">{event.type}</div>
              <pre>{JSON.stringify(event.data, null, 2)}</pre>
              <div className="event-meta">
                {new Date(event.timestamp).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EventLogDisplay;

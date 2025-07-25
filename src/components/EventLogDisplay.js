import React from 'react';

/**
 * EventLogDisplay component.
 * Displays a list of events with their type and the full raw event object.
 *
 * @param {Array<object>} events - An array of event objects to display.
 */
function EventLogDisplay({ events = [] }) {
  const reversedEvents = [...events].reverse();

  return (
    <div className="aggregate-column">
      <h3>Event Log</h3>
      <ul className="event-list">
        {reversedEvents.length === 0 ? (
          <li>No events recorded yet.</li>
        ) : (
          reversedEvents.map((event, index) => (
            <li key={event.eventId || index}>
              <div className="event-type">{event.type}</div>
              <pre>{JSON.stringify(event, null, 2)}</pre>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}


export default EventLogDisplay;

import React from 'react';

/**
 * EventLogDisplay component.
 * Displays a list of events with their type and the full raw event object.
 *
 * @param {Array<object>} events - An array of event objects to display.
 */
function EventLogDisplay({ events }) {
  // Reverse the events array to show the most recent events at the top
  const reversedEvents = [...events].reverse();

  return (
    <div className="aggregate-column">
      <h3>Event Log</h3>
      <ul className="event-list">
        {reversedEvents.length === 0 ? (
          <li>No events recorded yet.</li>
        ) : (
          reversedEvents.map((event, index) => (
            <li key={event.eventId || index}> {/* Use eventId if available, fallback to index */}
              <div className="event-type">{event.type}</div>
              {/* Display the entire raw event object as a single JSON block */}
              <pre>{JSON.stringify(event, null, 2)}</pre>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default EventLogDisplay;

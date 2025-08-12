import React, { useState, useEffect } from 'react';
import { getAllEvents } from './domain/core/eventStoreUtils';
import './EventsPage.css';

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [aggregateTypeFilter, setAggregateTypeFilter] = useState('');
  const [uniqueAggregateTypes, setUniqueAggregateTypes] = useState([]);

  useEffect(() => {
    const allEvents = getAllEvents();
    setEvents(allEvents);
    const types = [...new Set(allEvents.map(event => event.aggregateType).filter(Boolean))];
    setUniqueAggregateTypes(types);
  }, []);

  const filteredEvents = aggregateTypeFilter
    ? events.filter(event => event.aggregateType === aggregateTypeFilter)
    : events;

  return (
    <div className="events-page">
      <header className="events-header">
        <h1>Event Stream</h1>
        <div className="filter-container">
          <label htmlFor="aggregateTypeFilter">Filter by Type:</label>
          <select
            id="aggregateTypeFilter"
            value={aggregateTypeFilter}
            onChange={(e) => setAggregateTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {uniqueAggregateTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="events-container">
        {filteredEvents.length === 0 ? (
          <div className="no-events">No events found</div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((event, index) => (
              <div className="event-card" key={event.eventId || index}>
                <div className="event-header">
                  <div className="event-type">{event.type}</div>
                  <div className="event-meta">
                    {event.aggregateType && <span className="aggregate-type">{event.aggregateType}</span>}
                    <span className="event-source">{event.source}</span>
                    <span className="event-time">
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="event-content">
                  <pre className="event-json">
                    {JSON.stringify(event, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default EventsPage;

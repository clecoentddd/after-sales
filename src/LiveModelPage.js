import React, { useEffect, useState } from 'react';
import { getAllEvents } from './domain/core/eventStoreUtils';
import './LiveRequestModel.css';

const LiveRequestModel = () => {
  const [events, setEvents] = useState([]);
  const [requestIds, setRequestIds] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);

  useEffect(() => {
    const allEvents = getAllEvents();
    setEvents(allEvents);

    const uniqueIds = Array.from(
      new Set(
        allEvents
          .map((e) => e.data?.requestId)
          .filter((id) => id !== undefined && id !== null)
      )
    );
    setRequestIds(uniqueIds);
  }, []);

  useEffect(() => {
    if (selectedRequestId) {
      const relevantEvents = events
        .filter((e) => e.data?.requestId === selectedRequestId)
        .sort(
          (a, b) =>
            new Date(a.metadata?.timestamp || a.timestamp).getTime() -
            new Date(b.metadata?.timestamp || b.timestamp).getTime()
        );
      setFilteredEvents(relevantEvents);
    } else {
      setFilteredEvents([]);
    }
  }, [selectedRequestId, events]);

  return (
    <div className="live-request-container">
      <h2>📦 Parcel-Style Request Timeline</h2>
      <div className="flex" style={{ display: 'flex', gap: '2rem' }}>
        <div className="request-id-list">
          <h3>Request IDs</h3>
          <ul>
            {requestIds.map((id) => (
              <li key={id}>
                <button
                  onClick={() => setSelectedRequestId(id)}
                  className={selectedRequestId === id ? 'selected' : ''}
                >
                  {id}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="timeline-container">
          <h3 className="timeline-title">
            Events for: {selectedRequestId || 'None selected'}
          </h3>
          <div className="timeline">
            {filteredEvents.map((event, index) => (
              <div key={index} className="timeline-event">
                <div className="event-type">{event.type}</div>
                <div className="timestamp">
                  {new Date(
                    event.metadata?.timestamp || event.timestamp
                  ).toLocaleString()}
                </div>
                <pre className="event-data">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))}
            {filteredEvents.length === 0 && (
              <div className="text-gray-500">No events to display.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveRequestModel;

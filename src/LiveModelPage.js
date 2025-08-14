import React, { useEffect, useState } from 'react';
import { getAllEvents } from './domain/core/eventStoreUtils';
import './LiveRequestModel.css';

const LiveRequestModel = () => {
  const [events, setEvents] = useState([]);
  const [requestIds, setRequestIds] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [expandedEvents, setExpandedEvents] = useState({});

  useEffect(() => {
    console.log('[LiveRequestModel] Fetching all events...');
    const allEvents = getAllEvents();

    // Log all events for debugging
    console.log('[LiveRequestModel] All events:', JSON.parse(JSON.stringify(allEvents)));

    setEvents(allEvents);

    // Extract unique request IDs from events
    const uniqueIds = Array.from(
      new Set(
        allEvents
          .map((e) => e.requestId || e.data?.requestId)
          .filter((id) => id !== undefined && id !== null)
      )
    );
    setRequestIds(uniqueIds);
  }, []);

  useEffect(() => {
    if (!selectedRequestId) {
      setFilteredEvents([]);
      return;
    }

    const relevantEvents = events
      .filter((e) =>
        e.requestId === selectedRequestId ||
        e.data?.requestId === selectedRequestId ||
        (e.aggregateId === selectedRequestId)
      )
      .sort(
        (a, b) =>
          new Date(a.metadata?.timestamp || a.timestamp).getTime() -
          new Date(b.metadata?.timestamp || b.timestamp).getTime()
      );

    setFilteredEvents(relevantEvents);
    setExpandedEvents({});
  }, [selectedRequestId, events]);

  const toggleEventExpansion = (index) => {
    setExpandedEvents(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="live-request-container">
      <h2 className="page-title">📦 Request Timeline</h2>
      <div className="content-container">
        <div className="request-id-list">
          <h3>Request IDs</h3>
          {requestIds.length === 0 ? (
            <div className="empty-state">No request IDs found</div>
          ) : (
            <ul className="request-id-ul">
              {requestIds.map((id) => (
                <li key={id} className="request-id-item">
                  <button
                    onClick={() => setSelectedRequestId(id)}
                    className={`request-id-btn ${selectedRequestId === id ? 'selected' : ''}`}
                  >
                    {id}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="timeline-container">
          <h3 className="timeline-title">
            {selectedRequestId ? `Events for: ${selectedRequestId}` : 'Select a request ID'}
          </h3>

          {filteredEvents.length === 0 && selectedRequestId && (
            <div className="empty-state">No events found for this request</div>
          )}

          <div className="timeline">
            {filteredEvents.map((event, index) => (
              <div key={`${event.type}-${index}`} className="timeline-event-card">
                <div
                  className="event-header"
                  onClick={() => toggleEventExpansion(index)}
                >
                  <div className="event-type">{event.type}</div>
                  <div className="event-timestamp">
                    {new Date(event.metadata?.timestamp || event.timestamp).toLocaleString()}
                  </div>
                  <div className={`expand-icon ${expandedEvents[index] ? 'expanded' : ''}`}>
                    {expandedEvents[index] ? '▼' : '▶'}
                  </div>
                </div>

                {expandedEvents[index] && (
                  <div className="event-details">
                    <div className="event-metadata">
                      {event.aggregateId && (
                        <div className="metadata-item">
                          <span className="metadata-label">ID:</span>
                          <span className="metadata-value">{event.aggregateId}</span>
                        </div>
                      )}
                      {event.requestId && event.requestId !== event.aggregateId && (
                        <div className="metadata-item">
                          <span className="metadata-label">Request:</span>
                          <span className="metadata-value">{event.requestId}</span>
                        </div>
                      )}
                      {event.changeRequestId && (
                        <div className="metadata-item">
                          <span className="metadata-label">Change Request:</span>
                          <span className="metadata-value">{event.changeRequestId}</span>
                        </div>
                      )}
                    </div>

                    <pre className="event-data">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveRequestModel;

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
    console.log('[LiveRequestModel] All events:', JSON.parse(JSON.stringify(allEvents)));
    setEvents(allEvents);

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
      .filter(
        (e) =>
          e.requestId === selectedRequestId ||
          e.data?.requestId === selectedRequestId ||
          e.aggregateId === selectedRequestId
      );

    setFilteredEvents(relevantEvents);
    setExpandedEvents({});
  }, [selectedRequestId, events]);

  const toggleEventExpansion = (index) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // ---- Group events by changeRequestId and sort by timestamp ----
  const groupsMap = {};
  filteredEvents.forEach((event) => {
    const crId = event.changeRequestId || event.data?.changeRequestId || 'NO_CR';
    if (!groupsMap[crId]) groupsMap[crId] = [];
    groupsMap[crId].push(event);
  });

  const groups = Object.entries(groupsMap).map(([crId, events]) => ({
    crId,
    events: events.sort(
      (a, b) =>
        new Date(b.metadata?.timestamp || b.timestamp).getTime() -
        new Date(a.metadata?.timestamp || a.timestamp).getTime() // oldest at bottom
    ),
  }));

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

        <div className="timeline">
          {groups.map((group, gIndex) => (
            <div key={group.crId} className="cr-group">
              <div className="cr-events">
                {group.events.map((event, eIndex) => (
                  <div
                    key={`${event.type}-${gIndex}-${eIndex}`}
                    className="timeline-event-card"
                  >
                    <div
                      className="event-header"
                      onClick={() => toggleEventExpansion(`${gIndex}-${eIndex}`)}
                    >
                      <div className="event-type">{event.type}</div>
                      <div className="event-timestamp">
                        {new Date(event.metadata?.timestamp || event.timestamp).toLocaleString()}
                      </div>
                      <div
                        className={`expand-icon ${
                          expandedEvents[`${gIndex}-${eIndex}`] ? 'expanded' : ''
                        }`}
                      >
                        {expandedEvents[`${gIndex}-${eIndex}`] ? '▼' : '▶'}
                      </div>
                    </div>

                    {expandedEvents[`${gIndex}-${eIndex}`] && (
                      <div className="event-details">
                        <pre className="event-data">{JSON.stringify(event.data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="cr-gutter">
                <div className="cr-label">CR {group.crId}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveRequestModel;

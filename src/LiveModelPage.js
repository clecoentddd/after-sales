import React, { useEffect, useState } from 'react';
import { getAllEvents } from './domain/core/eventStoreUtils';

const LiveRequestModel = () => {
  const [events, setEvents] = useState([]);
  const [requestIds, setRequestIds] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);

  useEffect(() => {
    const allEvents = getAllEvents();

    setEvents(allEvents);

    // Extract unique requestIds from event data
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
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📡 Live Request Model</h2>
      <div className="flex gap-4">
        <div className="w-1/3">
          <h3 className="font-semibold mb-2">All Request IDs</h3>
          <ul className="overflow-y-auto max-h-80 border rounded p-2">
            {requestIds.map((id) => (
              <li key={id}>
                <button
                  onClick={() => setSelectedRequestId(id)}
                  className={`text-left w-full p-1 hover:bg-blue-100 rounded ${
                    selectedRequestId === id ? 'bg-blue-200' : ''
                  }`}
                >
                  {id}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-2/3">
          <h3 className="font-semibold mb-2">
            Events for Request ID: {selectedRequestId || 'None selected'}
          </h3>
          <ul className="space-y-2 max-h-96 overflow-y-auto border rounded p-2 bg-gray-50">
            {filteredEvents.map((event, index) => (
              <li
                key={index}
                className="p-2 rounded border bg-white shadow text-sm"
              >
                <div className="font-bold text-blue-700">{event.type}</div>
                <div className="text-gray-600">
                  {new Date(
                    event.metadata?.timestamp || event.timestamp
                  ).toLocaleString()}
                </div>
                <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </li>
            ))}
            {filteredEvents.length === 0 && (
              <div className="text-gray-500">No events to display.</div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LiveRequestModel;

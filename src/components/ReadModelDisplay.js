// src/components/ReadModelDisplay.js
import React from 'react';

/**
 * Reusable component to display a read model (list of aggregate data).
 * @param {object} props - Component properties.
 * @param {Array<object>} props.items - The array of data items to display (e.g., organizations, customers).
 * @param {string} props.idKey - The key for the unique ID of each item (e.g., 'organizationId', 'customerId').
 * @param {function} props.renderDetails - A function that takes an item and returns JSX for its details.
 */
const ReadModelDisplay = ({ items, idKey, renderDetails }) => {
  return (
    <div className="aggregate-column">
      <h3>Read Model</h3>
      {items.length === 0 ? (
        <p>No items yet</p>
      ) : (
        <ul className="model-list">
          {items.map(item => (
            <li key={item[idKey]}>
              {renderDetails(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReadModelDisplay;

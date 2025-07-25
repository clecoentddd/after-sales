import React from 'react';

const ReadModelDisplay = ({ items = [], idKey, renderDetails }) => {
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

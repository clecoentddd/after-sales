const rows = [];

export const jobChangeRequestProjection = {
  insert: (row) => {
    console.log('[Projection] Inserting row:', row);
    rows.push(row);
    return row;
  },

  update: (predicate, updates) => {
    console.log('[Projection] Updating rows with:', updates);
    rows.forEach((r, index) => {
      if (predicate(r)) {
        console.log(`[Projection] Updating row at index ${index}:`, r);
        Object.assign(r, updates);
        console.log(`[Projection] Updated row at index ${index}:`, r);
      }
    });
  },

  getAll: () => {
    console.log('[Projection] Getting all rows:', rows);
    return [...rows];
  },

  clear: () => {
    console.log('[Projection] Clearing all rows');
    rows.length = 0;
  },

  findByRequestId: (requestId) => {
    const row = rows.find(r => r.requestId === requestId);
    console.log('[Projection] findByRequestId:', requestId, '=>', row);
    return row;
  },

   updateTodo: (requestId, changeRequestId, todo) => {
    console.log(`[Projection] Updating todo for requestId=${requestId}, changeRequestId=${changeRequestId} => ${todo}`);
    rows.forEach((r, index) => {
      if (r.requestId === requestId && r.changeRequestId === changeRequestId) {
        console.log(`[Projection] Before update at index ${index}:`, r);
        r.todo = todo;
        console.log(`[Projection] After update at index ${index}:`, r);
      }
    });
  },
};

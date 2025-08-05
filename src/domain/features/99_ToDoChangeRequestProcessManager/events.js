export const TodoListUpdatedEvent = () => ({
  type: 'TodoListUpdated',
  data: {
    timestamp: new Date().toISOString()
  }
});
class EventBus {
  constructor() {
    this.subscriptions = new Map();
  }

  publish(event) {
    const handlers = this.subscriptions.get(event.type) || [];
    handlers.forEach(handler => handler(event));
  }

  subscribe(eventType, handler) {
    console.log(`[eventBus] Subscribing to event type: ${eventType}`);
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    this.subscriptions.get(eventType).push(handler);

    return () => this.unsubscribe(eventType, handler);
  }

  unsubscribe(eventType, handler) {
    const handlers = this.subscriptions.get(eventType) || [];
    this.subscriptions.set(
      eventType,
      handlers.filter(h => h !== handler)
    );
  }
}

export const eventBus = new EventBus();
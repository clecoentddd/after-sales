class EventBus {
  constructor() {
    this.subscriptions = new Map();
  }

  publish(event) {
    console.log("[EventBus] event to publish :", event);
    const handlers = this.subscriptions.get(event.type) || [];
    handlers.forEach(handler => handler(event));
  }

  subscribe(eventType, handler) {
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
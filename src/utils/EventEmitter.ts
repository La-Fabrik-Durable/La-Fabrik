type Listener<TPayload> = (payload: TPayload) => void;

export class EventEmitter<TEvents extends Record<string, unknown>> {
  private readonly listeners = new Map<
    keyof TEvents,
    Set<Listener<TEvents[keyof TEvents]>>
  >();

  on<TKey extends keyof TEvents>(
    event: TKey,
    listener: Listener<TEvents[TKey]>,
  ): () => void {
    const currentListeners = this.listeners.get(event) ?? new Set();
    currentListeners.add(listener as Listener<TEvents[keyof TEvents]>);
    this.listeners.set(event, currentListeners);

    return () => {
      this.off(event, listener);
    };
  }

  off<TKey extends keyof TEvents>(
    event: TKey,
    listener: Listener<TEvents[TKey]>,
  ): void {
    const currentListeners = this.listeners.get(event);

    if (!currentListeners) {
      return;
    }

    currentListeners.delete(listener as Listener<TEvents[keyof TEvents]>);

    if (currentListeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    const currentListeners = this.listeners.get(event);

    if (!currentListeners) {
      return;
    }

    currentListeners.forEach((listener) => {
      listener(payload as TEvents[keyof TEvents]);
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}

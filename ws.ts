export type ReconnectingWebsocketOptions = {
  url?: string | URL;
  signal?: AbortSignal;
  reconnectionInterval?: number;
};

export class ReconnectingWebsocket<
  T extends Parameters<WebSocket["send"]>[0]
> extends EventTarget {
  #ws: WebSocket | undefined = undefined;
  #timeoutId?: number = undefined;
  #isConnected = false;
  #previousIsConnected = false;
  #isClosed = false;
  #url: string | URL;
  #reconnectionInterval: number;

  constructor(options?: ReconnectingWebsocketOptions) {
    super();
    this.#url = options?.url ?? "/";
    this.#reconnectionInterval = options?.reconnectionInterval ?? 5000;
    this.#ws = this.#connect();

    options?.signal?.addEventListener("abort", () => {
      this.close();
    });
  }

  #setState(newState: boolean) {
    this.#previousIsConnected = this.#isConnected;
    this.#isConnected = newState;

    if (this.#previousIsConnected !== this.#isConnected) {
      const ce = new CustomEvent("connection", { detail: this.#isConnected });
      this.dispatchEvent(ce);
    }
  }

  #connect() {
    clearTimeout(this.#timeoutId);
    const ws = new WebSocket(this.#url);

    ws.onopen = () => {
      this.#setState(true);
    };

    ws.onmessage = (ev: MessageEvent<T>) => {
      const ce = new CustomEvent("message", { detail: ev.data });
      this.dispatchEvent(ce);
    };

    ws.onclose = (_ev) => {
      this.#setState(false);
      if (!this.#isClosed) {
        this.#timeoutId = setTimeout(
          () => this.#connect(),
          this.#reconnectionInterval
        );
      }
    };

    return (this.#ws = ws);
  }

  send(data: T) {
    this.#ws?.send(data);
  }

  close() {
    this.#isClosed = true;
    this.#ws?.close();
  }
}

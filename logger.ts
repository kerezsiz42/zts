export type LoggerOptions = {
  flushInterval?: number;
  flushThreshold?: number;
  signal?: AbortSignal;
};

// TODO: compare to console log
export class Logger {
  #queue: string[] = [];
  #flushInterval: number;
  #flushThreshold: number;
  #encoder = new TextEncoder();
  #isClosed = false;

  constructor(options?: LoggerOptions) {
    this.#flushInterval = options?.flushInterval ?? 100;
    this.#flushThreshold = options?.flushThreshold ?? 20;

    options?.signal?.addEventListener("abort", () => {
      this.close();
    });

    setInterval(() => {
      if (this.#queue.length > 0) {
        this.flush();
      }
    }, this.#flushInterval);
  }

  flush() {
    const lines = `${this.#queue.join("\n")}\n`;
    const data = this.#encoder.encode(lines);
    Deno.stdout.write(data);
    this.#queue = [];
  }

  log(level: "INFO" | "ERROR" | "DEBUG" | "WARN", msg: string, data?: any) {
    if (this.#isClosed) throw new Error("Logger is closed");
    const time = new Date().toISOString();
    const json = toJsonString({ time, level, msg, ...data });
    this.#queue.push(json);

    if (this.#queue.length >= this.#flushThreshold) {
      this.flush();
    }
  }

  close() {
    this.#isClosed = true;
    this.flush();
  }
}

// TODO: check if this is faster
function toJsonString(value: any): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "string") {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  if (Array.isArray(value)) {
    const elements = value.map(toJsonString);
    return `[${elements.join(",")}]`;
  }

  if (typeof value === "object") {
    const properties = [];
    for (const key of Object.keys(value)) {
      const keyString = toJsonString(key);
      const valueString = toJsonString(value[key]);
      if (valueString === "") {
        continue;
      }

      properties.push(`${keyString}:${valueString}`);
    }
    return `{${properties.join(",")}}`;
  }

  return "";
}

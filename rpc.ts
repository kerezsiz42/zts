import { Err, type Fallible } from "./error.ts";

export class Rpc {
  #baseURL: string;
  #headers?: HeadersInit;

  constructor(baseUrl: string, headers?: HeadersInit) {
    this.#baseURL = baseUrl;
    this.#headers = headers;
  }

  async query<T>(procedure: string, params: object): Promise<Fallible<T>> {
    const input = `${this.#baseURL}/${procedure}/${encodeURIComponent(
      JSON.stringify(params)
    )}`;
    const r = await fetch(input, {
      method: "GET",
      ...this.#headers,
    });

    if (!r.ok) {
      const err = await r.text();
      return [
        null,
        new Err(`Rpc.query(${procedure}, ${params}): ${err}`),
      ] as const;
    }

    const data = await r.json();
    return [data, null] as const;
  }

  async mutate<T>(procedure: string, params: object): Promise<Fallible<T>> {
    const r = await fetch(`${this.#baseURL}/${procedure}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.#headers,
      },
      body: JSON.stringify(params),
    });

    if (!r.ok) {
      const err = await r.text();
      return [
        null,
        new Err(`Rpc.mutate(${procedure}, ${params}): ${err}`),
      ] as const;
    }

    const data = await r.json();
    return [data, null] as const;
  }
}

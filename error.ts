export class Err {
  #error: string;
  #wrappedError?: Err;

  constructor(error: string, wrappedError?: Err) {
    this.#error = error;
    this.#wrappedError = wrappedError;
  }

  toString(): string {
    return this.#wrappedError
      ? `${this.#error}: ${this.#wrappedError}`
      : this.#error;
  }
}

export async function erroneous<T>(fn: () => Promise<T>): Promise<Fallible<T>> {
  try {
    return [await fn(), null] as const;
  } catch (u) {
    if (u instanceof Error) {
      return [null, new Err(u.message)] as const;
    } else if (typeof u === "string") {
      return [null, new Err(u)] as const;
    } else {
      throw u;
    }
  }
}

// If a function returns Fallible<T> then it must be guaranteed that it never throws error.
export type Fallible<T> = readonly [null, Err] | readonly [T, null];

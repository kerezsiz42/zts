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

export type Fallible<T> = readonly [null, Err] | readonly [T, null];

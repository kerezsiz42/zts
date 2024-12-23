import nodeCrypto from "node:crypto";

import { Err, type Fallible } from "./error.ts";

export class ScryptPassword {
  #saltLength: number;
  #keyLength: number;
  #textEncoder = new TextEncoder();

  constructor(saltLength = 8, keyLength = 64) {
    this.#saltLength = saltLength;
    this.#keyLength = keyLength;
  }

  hash(password: string): Promise<Fallible<string>> {
    return new Promise((resolve, reject) => {
      const salt = nodeCrypto.randomBytes(this.#saltLength).toString("hex");

      nodeCrypto.scrypt(password, salt, this.#keyLength, (err, derivedKey) => {
        if (err !== null) {
          return reject([null, new Err(err.message)] as const);
        }

        const hash = `${salt}:${derivedKey.toString("hex")}`;
        return resolve([hash, null] as const);
      });
    });
  }

  verify(password: string, hash: string): Promise<Fallible<boolean>> {
    return new Promise((resolve, reject) => {
      const [salt, key] = hash.split(":");

      nodeCrypto.scrypt(password, salt, this.#keyLength, (err, derivedKey) => {
        if (err !== null) {
          return reject([null, new Err(err.message)] as const);
        }

        const isEqual = nodeCrypto.timingSafeEqual(
          this.#textEncoder.encode(derivedKey.toString("hex")),
          this.#textEncoder.encode(key)
        );
        return resolve([isEqual, null] as const);
      });
    });
  }
}

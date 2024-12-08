export const ALPHANUM =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateId(length: number = 16) {
  const bs = new Uint8Array(length);
  crypto.getRandomValues(bs);

  let id = "";
  for (const b of bs) {
    const randomIndex = b % ALPHANUM.length;
    id += ALPHANUM[randomIndex];
  }

  return id;
}

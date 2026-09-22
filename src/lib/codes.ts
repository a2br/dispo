const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no 0/o/1/l/i

/** Short, unambiguous random code for share links. */
export function newCode(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function isCode(s: string): boolean {
  return /^[a-z2-9]{6,16}$/.test(s);
}

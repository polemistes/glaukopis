// The types of `reckon.js`, for the tests of Glaukopis, which are written in TypeScript.

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Message {
  kind: string;
  url: string;
  title: string;
  when: string;
  text: string;
  html: string;
  alt: string;
  name: string;
  image?: string;
}

export type Outcome = { ok: true } | { ok: false; reason: string };

export const HELPER: string;
export const KINDS: string[];
export function cropOf(rect: Rect, view: Size, picture: Size): Rect | null;
export function rectBetween(ax: number, ay: number, bx: number, by: number): Rect;
export function nameOfImage(src: string): string;
export function messageOf(
  kind: string,
  page: { url?: string; title?: string },
  parts: { text?: string; html?: string; alt?: string; name?: string; image?: string },
  now?: Date,
): Message;
export function outcomeOf(answer: unknown, failure?: string): Outcome;
export function base64OfBytes(bytes: Uint8Array): string;
export function partsOfDataUrl(address: string): { type: string; base64: string } | null;
export function bytesOfDataUrl(address: string): Uint8Array | null;

// The types of `page.js`, for the tests of Glaukopis, which are written in TypeScript.

import type { Rect, Size } from './reckon';

export interface Page {
  url: string;
  title: string;
}

export function readSelection(): (Page & { text: string; html: string }) | null;
export function readPage(): Page & { text: string; html: string };
export function readImage(
  target: number,
): (Page & { png: string | null; alt: string; src: string; rect: Rect; view: Size }) | null;
export function markRegion(): Promise<(Page & { rect: Rect; view: Size }) | null>;

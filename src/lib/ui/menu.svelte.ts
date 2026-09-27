/**
 * Menus. One host (`MenuHost.svelte`, mounted once in `App.svelte`) shows
 * whatever menu is open. Any code opens a menu by calling `openMenu`.
 */

import type { Component } from 'svelte';
import { pointRect, type Align, type RectLike, type Side } from './floating';

export type MenuItem =
  | {
      kind?: 'item';
      label: string;
      /** A second, quieter line under the label. */
      hint?: string;
      icon?: Component<{ size?: number | string }>;
      shortcut?: string;
      disabled?: boolean;
      danger?: boolean;
      checked?: boolean;
      action: () => void;
    }
  | { kind: 'separator' }
  | { kind: 'heading'; label: string }
  | {
      kind: 'submenu';
      label: string;
      icon?: Component<{ size?: number | string }>;
      disabled?: boolean;
      items: MenuItem[];
    };

export interface OpenMenu {
  anchor: RectLike;
  items: MenuItem[];
  side: Side;
  align: Align;
  minWidth?: number;
  onclose?: () => void;
}

class MenuState {
  current = $state<OpenMenu | null>(null);

  open(menu: OpenMenu) {
    this.current?.onclose?.();
    this.current = menu;
  }

  close() {
    const was = this.current;
    this.current = null;
    was?.onclose?.();
  }
}

export const menuState = new MenuState();

export interface MenuOptions {
  side?: Side;
  align?: Align;
  minWidth?: number;
  onclose?: () => void;
}

/** Opens a menu beside an element or a rectangle. */
export function openMenu(
  anchor: HTMLElement | RectLike,
  items: MenuItem[],
  options: MenuOptions = {},
) {
  const rect = anchor instanceof HTMLElement ? anchor.getBoundingClientRect() : anchor;
  menuState.open({
    anchor: rect,
    items: tidy(items),
    side: options.side ?? 'bottom',
    align: options.align ?? 'start',
    minWidth: options.minWidth,
    onclose: options.onclose,
  });
}

/** Opens a menu at the pointer, for `oncontextmenu`. */
export function openContextMenu(event: MouseEvent, items: MenuItem[]) {
  event.preventDefault();
  event.stopPropagation();
  menuState.open({
    anchor: pointRect(event.clientX, event.clientY),
    items: tidy(items),
    side: 'bottom',
    align: 'start',
  });
}

export function closeMenu() {
  menuState.close();
}

/** Removes separators that lead, trail or repeat, so callers can build lists freely. */
function tidy(items: MenuItem[]): MenuItem[] {
  const out: MenuItem[] = [];
  for (const item of items) {
    if (item.kind === 'separator') {
      if (out.length === 0 || out[out.length - 1].kind === 'separator') continue;
    }
    out.push(item);
  }
  while (out.length && out[out.length - 1].kind === 'separator') out.pop();
  return out;
}

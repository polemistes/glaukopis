/**
 * The sides of the window (ADR 0064): one or two, each showing a project of
 * its own at an element, as diagram, text or timeline. Nothing is the
 * project of the view: what is of the window reads the active side, the one
 * that has the focus. The window keeps its arrangement (the sides, the
 * focus, whether they are switched, how the room is shared, the panes) in
 * the settings, and opens with it.
 */

import type { MapMode, Route } from '$lib/state/router.svelte';
import { keptZoom } from '$lib/preview/zoom';

/** A side of the window, as the window keeps it. */
export interface SideSpec {
  /** Lasts while the side is shown: the panes and the bars name the side by it. */
  key: string;
  project: string;
  /** The element in view; none until the project says where it was left. */
  at: string | null;
  mode: MapMode;
  /** Whether the outline stands beside the text of this side. */
  outline: boolean;
  /**
   * Whether the view is to be that the project was left in, where no
   * element is named: none was asked for. Not kept.
   */
  fresh?: boolean;
}

/** What the document pane shows. Look is a column of the typesetting pane. */
export type DocumentTab = 'references' | 'images' | 'comments' | 'found' | 'history' | 'changes';

/** What the window keeps of its sides and its panes, with the settings. */
export interface Arrangement {
  sides: SideSpec[];
  focused: number;
  mirrored: boolean;
  /** The part of the width the first of two sides has. */
  split: number;
  /** The side the typesetting pane shows, by its place among the sides; none while it is closed. */
  typesetting: number | null;
  /** Whether the Look column of the typesetting pane is open. */
  look: boolean;
  /** Whether the document pane is open, and what it shows. */
  document: boolean;
  tab: DocumentTab;
  /** Whether the marks of whitespace are shown. */
  marks: boolean;
  /** The widths of the panes, and of the Look column, in pixels; nought for what is given. */
  typesettingWidth: number;
  documentWidth: number;
  lookWidth: number;
  /** How large the pages of the typesetting pane are shown: a factor of their size on paper, or none for the width of the pane. */
  zoom: number | null;
}

const MODES: readonly MapMode[] = ['diagram', 'text', 'timeline'];
const TABS: readonly DocumentTab[] = [
  'references',
  'images',
  'comments',
  'found',
  'history',
  'changes',
];
/** Tabs as an older arrangement kept them: Look went to the typesetting pane, the pictures are the images. */
const OLD_TABS: Readonly<Record<string, DocumentTab>> = { look: 'references', pictures: 'images' };

let made = 0;
/** A key of a side, new each time: two sides of one project are told apart by it. */
const newKey = () => `s${Date.now().toString(36)}${(made++).toString(36)}`;

/** A side as it is kept, read with care: what is not a side is none. */
function readSide(kept: unknown): SideSpec | null {
  if (!kept || typeof kept !== 'object') return null;
  const k = kept as Partial<SideSpec>;
  if (typeof k.project !== 'string' || !k.project) return null;
  return {
    key: newKey(),
    project: k.project,
    at: typeof k.at === 'string' && k.at ? k.at : null,
    mode: MODES.includes(k.mode as MapMode) ? (k.mode as MapMode) : 'diagram',
    outline: k.outline === true,
    fresh: !(typeof k.at === 'string' && k.at) && !MODES.includes(k.mode as MapMode),
  };
}

const clamp = (value: number, least: number, most: number) =>
  Math.min(Math.max(value, least), most);

/** The parts of the arrangement that are of the panes, as the panes hold them. */
export interface PaneParts {
  typesetting: string | null;
  look: boolean;
  document: boolean;
  tab: DocumentTab;
  marks: boolean;
  typesettingWidth: number;
  documentWidth: number;
  lookWidth: number;
  zoom: number | null;
}

export class Sides {
  sides = $state<SideSpec[]>([]);
  focused = $state(0);
  mirrored = $state(false);
  split = $state(0.5);

  /** The place of the active side among the sides. */
  get index(): number {
    return clamp(this.focused, 0, Math.max(0, this.sides.length - 1));
  }

  /** The active side, the one that has the focus. */
  get active(): SideSpec | undefined {
    return this.sides[this.index];
  }

  byKey(key: string | null | undefined): SideSpec | undefined {
    return key ? this.sides.find((s) => s.key === key) : undefined;
  }

  indexOf(key: string | null | undefined): number {
    return key ? this.sides.findIndex((s) => s.key === key) : -1;
  }

  /** Whether two sides are shown, of two projects. */
  get across(): boolean {
    return this.sides.length > 1 && this.sides[0].project !== this.sides[1].project;
  }

  /**
   * Opens a project in the active side, in the place of what was there; the
   * first side, where there is none. Without an element, where the project
   * was left.
   */
  open(project: string, at: string | null = null, mode?: MapMode) {
    const side = this.active;
    if (!side) {
      this.sides = [
        { key: newKey(), project, at, mode: mode ?? 'diagram', outline: false, fresh: !mode },
      ];
      this.focused = 0;
      return;
    }
    if (side.project === project) {
      if (at) side.at = at;
      if (mode) side.mode = mode;
      return;
    }
    // Another project in this side: a side of its own, so that what showed the old one is let go.
    this.sides[this.index] = {
      key: newKey(),
      project,
      at,
      mode: mode ?? side.mode,
      outline: side.outline,
      fresh: !mode,
    };
  }

  /** Opens a project in the other side, making one where there is one; the other side gets the focus. */
  beside(project: string, at: string | null = null, mode?: MapMode) {
    const side = this.active;
    if (!side) {
      this.open(project, at, mode);
      return;
    }
    const spec: SideSpec = {
      key: newKey(),
      project,
      at,
      mode: mode ?? side.mode,
      outline: false,
      fresh: !mode,
    };
    if (this.sides.length < 2) {
      this.sides = [side, spec];
      this.focused = 1;
      return;
    }
    const other = 1 - this.index;
    const there = this.sides[other];
    if (there.project === project) {
      if (at) there.at = at;
      if (mode) there.mode = mode;
    } else {
      this.sides[other] = spec;
    }
    this.focused = other;
  }

  /** The element in view of the active side shown the other way in a second side. */
  bothWays() {
    const side = this.active;
    if (!side) return;
    const spec: SideSpec = {
      key: newKey(),
      project: side.project,
      at: side.at,
      mode: side.mode === 'diagram' ? 'text' : 'diagram',
      outline: false,
    };
    this.sides = [side, spec];
    this.focused = 0;
  }

  /** Enters an element in a side; with a mode, it shows it that way. */
  show(key: string, at: string, mode?: MapMode) {
    const side = this.byKey(key);
    if (!side) return;
    side.at = at;
    if (mode) side.mode = mode;
  }

  setMode(key: string, mode: MapMode) {
    const side = this.byKey(key);
    if (side) side.mode = mode;
  }

  toggleOutline(key: string) {
    const side = this.byKey(key);
    if (side) side.outline = !side.outline;
  }

  focus(key: string) {
    const i = this.indexOf(key);
    if (i >= 0 && i !== this.focused) this.focused = i;
  }

  /** Closes a side. With none left, nothing is shown, and the window goes to the start screen. */
  close(key: string) {
    const i = this.indexOf(key);
    if (i < 0) return;
    this.sides = this.sides.filter((_, j) => j !== i);
    this.focused = 0;
    if (this.sides.length < 2) this.mirrored = false;
  }

  /** Closes every side that shows a project. */
  closeProject(project: string) {
    for (const side of this.sides.filter((s) => s.project === project)) this.close(side.key);
  }

  /** The two sides change places, as they are drawn; each keeps what it is. */
  switchSides() {
    if (this.sides.length > 1) this.mirrored = !this.mirrored;
  }

  /** Nothing is shown. */
  clear() {
    this.sides = [];
    this.focused = 0;
    this.mirrored = false;
  }

  /**
   * Lays the window out as it was kept, where the place names the project
   * of the active side that was kept (as it does when the window opens, or
   * the house goes back to the projects); else one side, at the project,
   * element and view the place names. Sides of projects that are gone are
   * left out.
   */
  arrange(
    kept: Partial<Arrangement> | null | undefined,
    route: Extract<Route, { view: 'project' }>,
    exists: (project: string) => boolean = () => true,
  ) {
    const keptSides = (Array.isArray(kept?.sides) ? kept.sides : [])
      .map(readSide)
      .filter((s): s is SideSpec => !!s && exists(s.project))
      .slice(0, 2);
    const keptFocus = Number.isInteger(kept?.focused) ? (kept!.focused as number) : 0;
    const keptActive = keptSides[clamp(keptFocus, 0, Math.max(0, keptSides.length - 1))];
    if (keptActive && keptActive.project === route.project) {
      if (route.at) keptActive.at = route.at;
      if (route.mode) keptActive.mode = route.mode;
      this.sides = keptSides;
      this.focused = keptSides.indexOf(keptActive);
      this.mirrored = keptSides.length > 1 && kept?.mirrored === true;
      this.split =
        typeof kept?.split === 'number' && Number.isFinite(kept.split)
          ? clamp(kept.split, 0.2, 0.8)
          : 0.5;
      return;
    }
    this.sides = [
      {
        key: newKey(),
        project: route.project,
        at: route.at ?? null,
        mode: route.mode ?? 'diagram',
        outline: false,
        fresh: !route.mode,
      },
    ];
    this.focused = 0;
    this.mirrored = false;
  }

  /** The arrangement as it is, to keep, with the parts the panes hold. */
  toKeep(panes: PaneParts): Arrangement {
    const typesetting = this.indexOf(panes.typesetting);
    return {
      sides: this.sides.map(({ fresh: _, ...s }) => s),
      focused: this.index,
      mirrored: this.sides.length > 1 && this.mirrored,
      split: this.split,
      typesetting: typesetting >= 0 ? typesetting : null,
      look: panes.look,
      document: panes.document,
      tab: panes.tab,
      marks: panes.marks,
      typesettingWidth: panes.typesettingWidth,
      documentWidth: panes.documentWidth,
      lookWidth: panes.lookWidth,
      zoom: panes.zoom,
    };
  }
}

/** The parts of a kept arrangement that are of the panes, read with care, the sides already laid out. */
export function paneParts(kept: Partial<Arrangement> | null | undefined, sides: Sides): PaneParts {
  const at = Number.isInteger(kept?.typesetting) ? (kept!.typesetting as number) : -1;
  const width = (w: unknown) => (typeof w === 'number' && Number.isFinite(w) && w > 0 ? w : 0);
  return {
    typesetting: sides.sides[at]?.key ?? null,
    look: kept?.look === true,
    document: kept?.document === true,
    tab: TABS.includes(kept?.tab as DocumentTab)
      ? (kept!.tab as DocumentTab)
      : (OLD_TABS[String(kept?.tab)] ?? 'references'),
    marks: kept?.marks !== false,
    typesettingWidth: width(kept?.typesettingWidth),
    documentWidth: width(kept?.documentWidth),
    lookWidth: width(kept?.lookWidth),
    zoom: keptZoom(kept?.zoom),
  };
}

export const sides = new Sides();

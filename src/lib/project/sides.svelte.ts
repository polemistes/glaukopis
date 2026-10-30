/**
 * The sides of the window (ADR 0064): one or two, each showing a project of
 * its own at an element, as diagram, text or timeline, or the sources of a
 * project in tabs, each a place in a file of the library (ADR 0069, 0072).
 * Nothing is the project of the view: what is of the window reads the
 * active side, the one that has the focus. The window keeps its arrangement
 * (the sides, the focus, whether they are switched, how the room is shared,
 * the panes, the project it was last in) in the settings, and opens with it;
 * the tabs of a project are kept with the project.
 */

import type { MapMode, Route } from '$lib/state/router.svelte';
import type { Beside } from './layout';
import { FILE, keptZoom } from '$lib/preview/zoom';
import type { Place } from '$lib/viewer/pages';
import {
  activated,
  activeTab,
  emptySources,
  merged,
  moved,
  placed,
  readSources,
  replaced,
  stepped,
  without,
  withoutOthers,
  withFile,
  zoomed,
  type SourceTab,
  type Sources,
} from '$lib/viewer/sources';
import { sourcesStore, type SourcesOf } from '$lib/viewer/sources.svelte';

/** A side of the window that shows a project, as the window keeps it. */
export interface MapSide {
  kind: 'map';
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
  /**
   * Whether the project has just come into this side, opened from the list,
   * a link or the start screen: it brings what stood beside it when it was
   * left, where the other side is free (ADR 0073). Not kept.
   */
  arriving?: boolean;
}

/**
 * A side of the window that shows files of the library in tabs (ADR 0069,
 * 0072): the sources of a project, the one beside it or the one the window
 * was last in; or, where there is no project at all, tabs of its own.
 */
export interface FileSide {
  kind: 'file';
  key: string;
  /** The project whose sources it shows; none where there was none to show. */
  project: string | null;
  /** Its own tabs, where it has no project. */
  own: Sources | null;
}

/** A side of the window: a project at an element, or a file. */
export type SideSpec = MapSide | FileSide;

/** Whether a side shows a project. */
export const isMap = (side: SideSpec | null | undefined): side is MapSide => side?.kind === 'map';
/** Whether a side shows a file. */
export const isFile = (side: SideSpec | null | undefined): side is FileSide =>
  side?.kind === 'file';

/**
 * What comes beside a project arriving in a side, of what stood beside it
 * when it was left (ADR 0073): its tabs, or itself the other way, where the
 * other side is free, none or a file side; nothing beside another project's
 * map, or the same project's, which is there already.
 */
export function besideOnArrival(
  beside: Beside | null,
  other: SideSpec | undefined,
): Beside['kind'] | null {
  if (!beside || isMap(other)) return null;
  if (beside.kind === 'tabs' && isFile(other)) return null;
  return beside.kind;
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
  /** The project the window was last in: a file shown with no project open shows its sources. */
  lastProject: string | null;
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

/** A file side of a project, or of none with tabs of its own. */
const fileSide = (project: string | null, own: Sources | null = null): FileSide => ({
  kind: 'file',
  key: newKey(),
  project,
  own: project ? null : (own ?? emptySources()),
});

/**
 * A side as it is kept, read with care: what is not a side is none. A side
 * kept before files were shown is a map; a file side kept before it had
 * tabs is one of no project, with one tab at its page (ADR 0072).
 */
function readSide(kept: unknown): SideSpec | null {
  if (!kept || typeof kept !== 'object') return null;
  const f = kept as Partial<FileSide> & { file?: unknown; page?: unknown; zoom?: unknown };
  if (f.kind === 'file') {
    if (typeof f.project === 'string' && f.project) return fileSide(f.project);
    if (typeof f.file === 'string' && f.file) {
      const page = Number.isInteger(f.page) && (f.page as number) > 0 ? (f.page as number) : 1;
      const tab = {
        id: newKey(),
        file: f.file,
        place: { page, at: 0 },
        zoom: keptZoom(f.zoom, FILE),
      };
      return fileSide(null, { tabs: [tab], active: tab.id });
    }
    return fileSide(null, readSources(f.own));
  }
  const k = kept as Partial<MapSide>;
  if (typeof k.project !== 'string' || !k.project) return null;
  return {
    kind: 'map',
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
  /** The project the window was last in (ADR 0072). */
  lastProject = $state<string | null>(null);
  /** Whether a project is there still: one deleted is not given a file side. */
  exists: (project: string) => boolean = () => true;
  #sources: SourcesOf;

  constructor(sources: SourcesOf) {
    this.#sources = sources;
  }

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

  /** The sides that show projects. */
  get maps(): MapSide[] {
    return this.sides.filter(isMap);
  }

  /**
   * The side whose document the panes and the keys of a project are about:
   * the active side where it shows a project, else the other where that
   * does; none where no side shows one.
   */
  get map(): MapSide | undefined {
    const active = this.active;
    if (isMap(active)) return active;
    return this.sides.find(isMap);
  }

  /** Whether two sides are shown, of two projects. */
  get across(): boolean {
    const [a, b] = this.sides;
    return isMap(a) && isMap(b) && a.project !== b.project;
  }

  /**
   * Opens a project in the active side, in the place of what was there; the
   * first side, where there is none. Without an element, where the project
   * was left.
   */
  open(project: string, at: string | null = null, mode?: MapMode) {
    this.#open(project, at, mode);
    this.#follow();
  }

  #open(project: string, at: string | null, mode?: MapMode) {
    const side = this.active;
    if (!side) {
      this.sides = [
        {
          kind: 'map',
          key: newKey(),
          project,
          at,
          mode: mode ?? 'diagram',
          outline: false,
          fresh: !mode,
          arriving: true,
        },
      ];
      this.focused = 0;
      return;
    }
    if (!isMap(side)) {
      // A file in this side: the project takes its place.
      this.sides[this.index] = {
        kind: 'map',
        key: newKey(),
        project,
        at,
        mode: mode ?? 'diagram',
        outline: false,
        fresh: !mode,
        arriving: true,
      };
      return;
    }
    if (side.project === project) {
      if (at) side.at = at;
      if (mode) side.mode = mode;
      return;
    }
    // Another project in this side: a side of its own, so that what showed the old one is let go.
    this.sides[this.index] = {
      kind: 'map',
      key: newKey(),
      project,
      at,
      mode: mode ?? side.mode,
      outline: side.outline,
      fresh: !mode,
      arriving: true,
    };
  }

  /** Opens a project in the other side, making one where there is one; the other side gets the focus. */
  beside(project: string, at: string | null = null, mode?: MapMode) {
    this.#beside(project, at, mode);
    this.#follow();
  }

  #beside(project: string, at: string | null, mode?: MapMode) {
    const side = this.active;
    if (!side) {
      this.#open(project, at, mode);
      return;
    }
    const spec: MapSide = {
      kind: 'map',
      key: newKey(),
      project,
      at,
      mode: mode ?? (isMap(side) ? side.mode : 'diagram'),
      outline: false,
      fresh: !mode,
      arriving: true,
    };
    if (this.sides.length < 2) {
      this.sides = [side, spec];
      this.focused = 1;
      return;
    }
    const other = 1 - this.index;
    const there = this.sides[other];
    if (isMap(there) && there.project === project) {
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
    if (!isMap(side)) return;
    const spec: MapSide = {
      kind: 'map',
      key: newKey(),
      project: side.project,
      at: side.at,
      mode: side.mode === 'diagram' ? 'text' : 'diagram',
      outline: false,
    };
    this.sides = [side, spec];
    this.focused = 0;
    this.#follow();
  }

  /** Enters an element in a side; with a mode, it shows it that way. */
  show(key: string, at: string, mode?: MapMode) {
    const side = this.byKey(key);
    if (!isMap(side)) return;
    side.at = at;
    if (mode) side.mode = mode;
  }

  setMode(key: string, mode: MapMode) {
    const side = this.byKey(key);
    if (isMap(side)) side.mode = mode;
  }

  toggleOutline(key: string) {
    const side = this.byKey(key);
    if (isMap(side)) side.outline = !side.outline;
  }

  // ---- files in tabs (ADR 0069, 0072) ----

  /** The sources a file side shows: its project's, or its own. */
  sourcesOf(side: FileSide): Sources {
    return side.project ? this.#sources.of(side.project) : (side.own ?? emptySources());
  }

  /** The tabs of a side, and the one shown; none for a map side. */
  tabs(key: string): Sources {
    const side = this.byKey(key);
    return isFile(side) ? this.sourcesOf(side) : emptySources();
  }

  /** The tab a file side shows. */
  activeTab(key: string): SourceTab | undefined {
    return activeTab(this.tabs(key));
  }

  #change(side: FileSide, change: (s: Sources) => Sources) {
    if (side.project) this.#sources.change(side.project, change);
    else side.own = change(side.own ?? emptySources());
  }

  #changeOf(key: string, change: (s: Sources) => Sources) {
    const side = this.byKey(key);
    if (isFile(side)) this.#change(side, change);
  }

  /** The project a new file side shows the sources of: the map beside it, else the one the window was last in. */
  #projectFor(beside: SideSpec | undefined): string | null {
    if (isMap(beside)) return beside.project;
    const last = this.lastProject;
    return last && this.exists(last) ? last : null;
  }

  /**
   * Shows a file of the library (ADR 0072): in the file side there is,
   * the active one first, as a new tab or in its tab where it has one; else
   * the other side becomes a file side of the project beside it, in the
   * place of what it showed, or one is made beside the one there is; with
   * no side at all, the first. The file side gets the focus. Gives its key.
   */
  showFile(file: string, place?: Place): string {
    const side = this.#fileSide();
    this.#change(side, (s) => withFile(s, file, place).sources);
    this.#follow();
    return side.key;
  }

  /**
   * Shows a file among the tabs of a project, with the project beside it
   * (ADR 0074): what *Show* does in the notice of a file added to a
   * project's tabs from the library. The project's map there is gets the
   * focus; else the active side shows the project, as it was left, with
   * nothing beside it but its tabs: what stood beside it when it was left
   * does not come, since the file is what was asked for. Gives the key of
   * the file side.
   */
  showFileOf(project: string, file: string, place?: Place): string {
    const own = this.sides.find((s) => isMap(s) && s.project === project);
    if (own) this.focus(own.key);
    else {
      // In the place of a map where there is one, so that the text stays where the text was.
      const map = this.sides.find(isMap);
      if (map) this.focus(map.key);
      this.#open(project, null);
      const opened = this.active;
      if (isMap(opened)) delete opened.arriving;
      this.#follow();
    }
    return this.showFile(file, place);
  }

  /**
   * Opens the tabs of the project beside the text as they were (ADR 0073):
   * the file side there is gets the focus; else one is made where
   * `showFile` would make it, with no tab added. Gives its key.
   */
  showTabs(): string {
    const side = this.#fileSide();
    this.#follow();
    return side.key;
  }

  /**
   * The file side files go to, focused: the one there is, the active one
   * first; else the other side made one, of the project beside it, in the
   * place of what it showed, or one made beside the side there is; with no
   * side at all, the first.
   */
  #fileSide(): FileSide {
    const active = this.active;
    const there = isFile(active) ? active : this.sides.find(isFile);
    if (there) {
      this.focus(there.key);
      return there;
    }
    const spec = fileSide(this.#projectFor(active));
    if (!active) {
      this.sides = [spec];
      this.focused = 0;
    } else if (this.sides.length < 2) {
      this.sides = [active, spec];
      this.focused = 1;
    } else {
      const other = 1 - this.index;
      this.sides[other] = spec;
      this.focused = other;
    }
    // The side as the window holds it, so that what changes it is seen.
    return this.sides.find((s) => s.key === spec.key) as FileSide;
  }

  /**
   * Shows a file in a side, as the trees under its chevron do: a file side
   * takes it as a tab; a map side becomes a file side of the project the
   * map beside it shows, else of its own (ADR 0072). Where that project has
   * a file side already, the file goes there.
   */
  showFileIn(key: string, file: string) {
    const side = this.byKey(key);
    if (!side) return;
    if (isFile(side)) {
      this.#change(side, (s) => withFile(s, file).sources);
      this.focus(key);
      return;
    }
    const i = this.indexOf(key);
    const beside = this.sides[1 - i];
    const project = isMap(beside) ? beside.project : side.project;
    const there = this.sides.find((s) => isFile(s) && s.project === project);
    if (isFile(there)) {
      this.#change(there, (s) => withFile(s, file).sources);
      this.focus(there.key);
      return;
    }
    const spec = fileSide(project);
    this.#change(spec, (s) => withFile(s, file).sources);
    this.sides[i] = spec;
    this.focused = i;
    this.#follow();
  }

  /** Shows a tab of a side. */
  activate(key: string, id: string) {
    this.#changeOf(key, (s) => activated(s, id));
  }

  /** Closes a tab; the side closes with its last. */
  closeTab(key: string, id: string) {
    const side = this.byKey(key);
    if (!isFile(side)) return;
    const before = this.sourcesOf(side);
    this.#change(side, (s) => without(s, id));
    if (before.tabs.length <= 1 && before.tabs.some((t) => t.id === id)) this.close(key);
  }

  /** Closes every tab of a side but one. */
  closeOtherTabs(key: string, id: string) {
    this.#changeOf(key, (s) => withoutOthers(s, id));
  }

  /** Moves a tab to stand at `to` among the tabs. */
  moveTab(key: string, id: string, to: number) {
    this.#changeOf(key, (s) => moved(s, id, to));
  }

  /** Opens the file of a tab again, in a new tab at the same place. */
  again(key: string, id: string) {
    const tab = this.tabs(key).tabs.find((t) => t.id === id);
    if (tab) this.#changeOf(key, (s) => withFile(s, tab.file, tab.place, true).sources);
  }

  /** The tab after the one shown, or before it. */
  stepTab(key: string, by: 1 | -1) {
    this.#changeOf(key, (s) => stepped(s, by));
  }

  /** Where a tab's pages were left: kept without telling what shows the tabs. */
  setPlace(key: string, id: string, place: Place) {
    const side = this.byKey(key);
    if (!isFile(side)) return;
    if (side.project) this.#sources.place(side.project, id, place);
    else side.own = placed(side.own ?? emptySources(), id, place);
  }

  /** How large a tab's pages are shown; none for the width of the side. */
  setTabZoom(key: string, id: string, zoom: number | null) {
    this.#changeOf(key, (s) => zoomed(s, id, zoom));
  }

  /** Puts another file into the tab shown, at its top and fitted: an image edited, kept as a new file (ADR 0071). */
  setFile(key: string, file: string) {
    const id = this.activeTab(key)?.id;
    if (id) this.#changeOf(key, (s) => replaced(s, id, file));
  }

  /**
   * What follows a change of the sides (ADR 0072): a file side beside a map
   * shows that map's project, and gives it the tabs it had of its own; the
   * project the window was last in is that of the active map, else of the
   * other side.
   */
  #follow() {
    this.sides.forEach((side, i) => {
      if (!isFile(side)) return;
      const beside = this.sides[1 - i];
      if (!isMap(beside) || side.project === beside.project) return;
      const own = side.own;
      side.project = beside.project;
      side.own = null;
      if (own?.tabs.length) this.#sources.change(beside.project, (s) => merged(s, own));
    });
    this.#remember();
  }

  #remember() {
    const active = this.active;
    const map = isMap(active) ? active : this.sides.find(isMap);
    const project = map?.project ?? (isFile(active) ? active.project : null);
    if (project && project !== this.lastProject) this.lastProject = project;
  }

  focus(key: string) {
    const i = this.indexOf(key);
    if (i >= 0 && i !== this.focused) {
      this.focused = i;
      this.#remember();
    }
  }

  /**
   * Closes a side. With none left, nothing is shown, and the window goes to
   * the start screen. A file side whose map closes keeps its project.
   */
  close(key: string) {
    const i = this.indexOf(key);
    if (i < 0) return;
    this.sides = this.sides.filter((_, j) => j !== i);
    this.focused = 0;
    if (this.sides.length < 2) this.mirrored = false;
    this.#remember();
  }

  /** Closes every side of a project that is gone, its file sides too, and forgets its sources. */
  closeProject(project: string) {
    for (const side of this.sides.filter((s) => s.project === project)) this.close(side.key);
    this.#sources.forget(project);
    if (this.lastProject === project) this.lastProject = null;
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
   * Lays the window out as it was kept, where the place names what the
   * active side that was kept showed (as it does when the window opens, or
   * the house goes back to the projects); else one side, at the project,
   * element and view the place names. A file the place names is shown where
   * files are shown, the window otherwise as it was kept (ADR 0072). Sides
   * of projects that are gone are left out.
   */
  arrange(
    kept: Partial<Arrangement> | null | undefined,
    route: Extract<Route, { view: 'project' } | { view: 'file' }>,
    exists: (project: string) => boolean = () => true,
  ) {
    this.exists = exists;
    const keptSides = (Array.isArray(kept?.sides) ? kept.sides : [])
      .map(readSide)
      .filter((s): s is SideSpec => !!s && (s.project === null || exists(s.project)))
      .slice(0, 2);
    const last = kept?.lastProject;
    this.lastProject = typeof last === 'string' && last && exists(last) ? last : null;
    const keptFocus = Number.isInteger(kept?.focused) ? (kept!.focused as number) : 0;
    const keptActive = keptSides[clamp(keptFocus, 0, Math.max(0, keptSides.length - 1))];
    const lay = () => {
      this.sides = keptSides;
      this.focused = Math.max(0, keptSides.indexOf(keptActive));
      this.mirrored = keptSides.length > 1 && kept?.mirrored === true;
      this.split =
        typeof kept?.split === 'number' && Number.isFinite(kept.split)
          ? clamp(kept.split, 0.2, 0.8)
          : 0.5;
    };
    if (route.view === 'project') {
      if (isMap(keptActive) && keptActive.project === route.project) {
        if (route.at) keptActive.at = route.at;
        if (route.mode) keptActive.mode = route.mode;
        lay();
      } else {
        // A project opened in a window that showed another arrives, as from the list.
        this.sides = [
          {
            kind: 'map',
            key: newKey(),
            project: route.project,
            at: route.at ?? null,
            mode: route.mode ?? 'diagram',
            outline: false,
            fresh: !route.mode,
            arriving: true,
          },
        ];
        this.focused = 0;
        this.mirrored = false;
      }
      this.#follow();
      return;
    }
    if (keptSides.length) lay();
    else this.clear();
    this.#follow();
    const place = route.page ? { page: route.page, at: 0 } : undefined;
    if (route.project && exists(route.project)) {
      this.showFileOf(route.project, route.file, place);
      return;
    }
    const side = this.active;
    if (isFile(side) && activeTab(this.sourcesOf(side))?.file === route.file) return;
    this.showFile(route.file, place);
  }

  /** The arrangement as it is, to keep, with the parts the panes hold. */
  toKeep(panes: PaneParts): Arrangement {
    const typesetting = this.indexOf(panes.typesetting);
    return {
      sides: this.sides.map((s) => {
        if (!isMap(s)) return s;
        const { fresh: _, arriving: __, ...kept } = s;
        return kept;
      }),
      focused: this.index,
      mirrored: this.sides.length > 1 && this.mirrored,
      split: this.split,
      lastProject: this.lastProject,
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

export const sides = new Sides(sourcesStore);

<script module lang="ts">
  import type { Project } from './model/project.svelte';

  /** A side of the view, as the list of projects is told of it (ADR 0063). */
  export interface ShownSide {
    /** The project's id. */
    id: string;
    /** The project itself, once it is open: the list shows its tree from it. */
    project: Project | null;
    /** The element in view in that side. */
    at: string;
    /** Whether the side has the focus. */
    focused: boolean;
  }

  /**
   * What the list of projects, which stands outside the view, is told of
   * what is shown: the projects of the sides, each once, with the element in
   * view there; how an element of one is entered; how another project, or
   * an element of it, is opened beside, in the other side; how the sides
   * that show a project are closed; and how the window of a project's
   * sharing is opened. Nothing while no project is open; a sharing asked
   * for then is `shareWanted`, which the view opens once it is there.
   */
  class Viewing {
    sides = $state.raw<ShownSide[]>([]);
    enter: ((project: string, id: string) => void) | null = null;
    beside: ((projectId: string, at?: string) => void) | null = null;
    close: ((projectId: string) => void) | null = null;
    share: ((projectId: string) => void) | null = null;
    shareWanted: string | null = null;
  }

  export const viewing = new Viewing();
</script>

<script lang="ts">
  /**
   * The window while projects are shown (ADR 0064): the top row with the
   * path of each side and Split view; the sides, each a project of its own
   * (`SideView`); the typesetting pane, with its Look column, of the side
   * whose button was pressed; the document pane, of the active side's
   * document. What is of the window (the
   * keys, the dialogs, the title, the pictures, the editor's dialogs) reads
   * the active side, the one that has the focus. The window's arrangement is
   * laid out as it was kept, and kept as it changes.
   */
  import { testHook } from '$lib/shell/testing';
  import WordsBar from '$lib/words/WordsBar.svelte';
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import Columns2 from '@lucide/svelte/icons/columns-2';
  import X from '@lucide/svelte/icons/x';
  import Presence from '$lib/sharing/Presence.svelte';
  import SharePanel from '$lib/sharing/SharePanel.svelte';
  import type { ProjectSharing } from '$lib/sharing/sharing.svelte';
  import { goThrough, takeWaiting } from '$lib/found/found.svelte';
  import DocumentHost from '$lib/documents/DocumentHost.svelte';
  import FoundPanel from '$lib/found/FoundPanel.svelte';
  import { countFound } from '$lib/found/gather';
  import { PictureSync, pictureSet } from './shared-pictures';
  import type { Entry } from '$lib/found/going.svelte';
  import { revealFound } from '$lib/found/reveal';
  import { pictures } from '$lib/figures/pictures.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import { notify, notifyError } from '$lib/ui/toast.svelte';
  import CommentsPanel from '$lib/comments/CommentsPanel.svelte';
  import { selectedPassage } from '$lib/comments/marks';
  import { commentsUi } from '$lib/comments/ui.svelte';
  import EditorHost from '$lib/editor/EditorHost.svelte';
  import { passageKindsCss } from '$lib/editor/kinds';
  import { ownKindsUi } from '$lib/editor/own-kinds.svelte';
  import { editorUi, hooksOf } from '$lib/editor/ui.svelte';
  import { library } from '$lib/state/library.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import { sourcesStore } from '$lib/viewer/sources.svelte';
  import { jumpFor } from '$lib/search/everything.svelte';
  import { takeCitations } from '$lib/library/citing.svelte';
  import { router } from '$lib/state/router.svelte';
  import { toggleProjectsPane } from '$lib/home/list.svelte';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { keysFor, shortcuts } from '$lib/shell/keys.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import Divider from '$lib/ui/Divider.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { t } from '$lib/i18n';
  import { comparing } from './copies.svelte';
  import { clamp, sameBeside, sideWidth, type Beside } from './layout';
  import { DocumentPane } from './document-pane.svelte';
  import ProjectDialogs from './ProjectDialogs.svelte';
  import BesideDialog from './BesideDialog.svelte';
  import { pickElement } from './picker.svelte';
  import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import FolderTree from '@lucide/svelte/icons/folder-tree';
  import Path from './Path.svelte';
  import type { ProjectInfo } from '$lib/api/projects';
  import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
  import ListTree from '@lucide/svelte/icons/list-tree';
  import { PROJECT } from './model/types';
  import PicturePanel from './PicturePanel.svelte';
  import ReferencePanel from './ReferencePanel.svelte';
  import SideTabs from './SideTabs.svelte';
  import SideView from './SideView.svelte';
  import FileSide from '$lib/viewer/FileSide.svelte';
  import FilePath from '$lib/viewer/FilePath.svelte';
  import FileChooser from '$lib/files/FileChooser.svelte';
  import FileText from '@lucide/svelte/icons/file-text';
  import PanelRight from '@lucide/svelte/icons/panel-right';
  import PreviewPanel from '$lib/preview/PreviewPanel.svelte';
  import LookPanel from '$lib/look/LookPanel.svelte';
  import { lookUi } from '$lib/look/look.svelte';
  import { aboutDocumentUi } from '$lib/document/about-document.svelte';
  import { templateEditorUi } from '$lib/document/template-editor.svelte';
  import { historyOf } from '$lib/history/history.svelte';
  import { me } from '$lib/history/me.svelte';
  import type { Looking } from '$lib/history/looking';
  import * as positions from '$lib/history/positions';
  import HistoryPanel from '$lib/history/HistoryPanel.svelte';
  import { provideReviewing } from '$lib/review/context';
  import ReviewPanel from '$lib/review/ReviewPanel.svelte';
  import { openProjects, type OpenProject } from './open-projects.svelte';
  import { panes } from './panes.svelte';
  import { sideApis } from './side-api.svelte';
  import {
    besideOnArrival,
    isFile,
    isMap,
    sides,
    type MapSide,
    type SideSpec,
  } from './sides.svelte';

  // ---- the arrangement, as it was kept and as it changes ----

  {
    const route = router.route;
    if (route.view === 'project' || route.view === 'file') {
      const kept = settings.value.arrangement;
      sides.arrange(
        kept,
        route,
        (id) => !projects.loaded || projects.list.some((p) => p.id === id),
      );
      panes.take(kept);
    }
  }

  // The arrangement is kept with the settings as it changes: the sides, the
  // focus, the switch, the split, the panes. It depends on all of them; it
  // writes only what differs from what it wrote last.
  let keptJson = '';
  $effect(() => {
    if (!sides.sides.length) return;
    const keep = sides.toKeep(panes.parts());
    const json = JSON.stringify(keep);
    untrack(() => {
      if (json === keptJson) return;
      keptJson = json;
      settings.set('arrangement', keep);
    });
  });

  // With no side left, the window goes to the start screen, and the house no
  // longer goes back to a project. It depends on how many sides there are.
  $effect(() => {
    if (sides.sides.length) return;
    untrack(() => {
      settings.set('arrangement', sides.toKeep(panes.parts()));
      router.forgetProject();
      router.go({ view: 'home' });
    });
  });

  // A file side of a project that is gone, deleted or in the trash, closes,
  // so that its sources are not kept for a project that is not there. It
  // depends on the list of projects and the sides.
  $effect(() => {
    if (!projects.loaded) return;
    const ids = new Set(projects.list.map((p) => p.id));
    const gone = sides.sides.filter((s) => isFile(s) && s.project && !ids.has(s.project));
    if (gone.length) untrack(() => gone.forEach((s) => closeSideOf(s.key)));
  });

  // The place follows the active side: its project, element and view, or
  // the file of its tab and the page it was at when the tab was shown. It
  // depends on those alone; scrolling a tab does not change it.
  $effect(() => {
    const side = sides.active;
    if (isFile(side)) {
      const tab = sides.activeTab(side.key);
      if (!tab) return;
      const place = {
        view: 'file' as const,
        file: tab.file,
        page: untrack(() => tab.place.page),
      };
      untrack(() => {
        const now = router.route;
        if (now.view === 'file' && now.file === place.file) return;
        router.replace(place);
      });
      return;
    }
    if (!side?.at) return;
    const place = { view: 'project' as const, project: side.project, at: side.at, mode: side.mode };
    untrack(() => {
      const now = router.route;
      if (
        now.view === 'project' &&
        now.project === place.project &&
        now.at === place.at &&
        now.mode === place.mode
      )
        return;
      router.replace(place);
    });
  });

  // A place gone to from elsewhere (the list, a link, back and forward) is
  // shown in the active side: another project opens there, the other side
  // stays as it was. It depends on the place alone.
  $effect(() => {
    const route = router.route;
    if (route.view === 'file') {
      untrack(() => {
        const side = sides.active;
        if (isFile(side) && sides.activeTab(side.key)?.file === route.file) {
          // Among the tabs of the project named, where one is: else it is shown there.
          if (!route.project || side.project === route.project) return;
        }
        const place = route.page ? { page: route.page, at: 0 } : undefined;
        if (route.project && projects.list.some((p) => p.id === route.project))
          sides.showFileOf(route.project, route.file, place);
        else sides.showFile(route.file, place);
      });
      return;
    }
    if (route.view !== 'project') return;
    untrack(() => {
      const side = sides.active;
      if (!isMap(side) || side.project !== route.project) {
        sides.open(route.project, route.at ?? null, route.mode);
        return;
      }
      if (route.at && route.at !== side.at) sideApis.get(side.key)?.show(route.at);
      if (route.mode && route.mode !== side.mode) sides.setMode(side.key, route.mode);
    });
  });

  // ---- the active side ----

  /**
   * The side whose document the panes, the dialogs and the keys of a project
   * are about: the active side where it shows a project, else the other
   * where that does (ADR 0069).
   */
  const active = $derived(sides.map);
  /** Whether the side that has the focus shows a project: the keys of the tree, the views and writing act only then. */
  const mapFocused = $derived(isMap(sides.active));
  const activeApi = $derived(active ? sideApis.get(active.key) : undefined);
  const activeOpen = $derived<OpenProject | undefined>(
    activeApi?.open ?? openProjects.get(active?.project),
  );
  /** The project of the active side, once it is open: what the keys, the undo and the dialogs act on. */
  const project = $derived(activeOpen?.project ?? null);
  const at = $derived(active?.at ?? PROJECT);
  /** The projects the sides show, by id: marked in the menu of all projects. */
  const shownIds = $derived([...new Set(sides.maps.map((s) => s.project))]);

  const openOf = (spec: SideSpec) => (isMap(spec) ? openProjects.get(spec.project) : undefined);

  // ---- a project comes back as it was shown (ADR 0073) ----

  // Each project shown keeps what stands beside it where that is its own:
  // its tabs, or itself at another element or the other way; else nothing,
  // as beside another project. Of a project in both sides, as the active one
  // sees it, which is where the project was left. It depends on the sides,
  // their elements and the focus.
  $effect(() => {
    const all = sides.sides;
    const active = sides.active;
    const first = isMap(active) ? [active, ...all.filter((s) => s.key !== active.key)] : all;
    const done = new Set<string>();
    for (const spec of first) {
      // A project that has just come is not alone yet: what it brings is still to come.
      if (!isMap(spec) || spec.arriving || done.has(spec.project)) continue;
      done.add(spec.project);
      const open = openOf(spec);
      if (open?.state !== 'open') continue;
      const other = all[1 - sides.indexOf(spec.key)];
      const beside: Beside | null =
        isFile(other) && other.project === spec.project
          ? { kind: 'tabs' }
          : isMap(other) && other.project === spec.project && other.at
            ? { kind: 'map', at: other.at, mode: other.mode }
            : null;
      untrack(() => {
        if (sameBeside(open.beside, beside)) return;
        open.beside = beside;
        openProjects.changed(open);
      });
    }
  });

  // A project that has just come into a side, from the list, a link or the
  // start screen, brings what stood beside it when it was left, where the
  // other side is free; the focus stays where it came. Once for each coming.
  $effect(() => {
    for (const spec of sides.maps) {
      if (!spec.arriving) continue;
      const open = openOf(spec);
      if (open?.state !== 'open' || !open.project?.node(PROJECT)) continue;
      const beside = open.beside;
      untrack(() => {
        delete spec.arriving;
        const i = sides.indexOf(spec.key);
        const what = besideOnArrival(beside, sides.sides[1 - i]);
        if (!what || !beside) return;
        sides.focus(spec.key);
        if (beside.kind === 'tabs') sides.showTabs();
        else {
          const at = open.project?.node(beside.at) ? beside.at : PROJECT;
          sides.beside(spec.project, at, beside.mode);
        }
        sides.focus(spec.key);
      });
    }
  });

  // What was asked of a project before it was open is answered once it is:
  // what was found through everything in what is written about a work is
  // shown with the references; the library asked where a work is cited; the
  // citations of a document it was made of are gone through.
  openProjects.onopened = (open) => {
    if (jumpFor(open.id)?.references) documentPane.show('references', true);
    const citations = takeCitations(open.id);
    if (citations) {
      documentPane.citationsOf = citations;
      documentPane.show('references', true);
    }
    const found = takeWaiting(open.id);
    if (found && open.project?.node(found)) goThrough(found);
  };

  // The list of projects, outside the view, shows the projects of the sides
  // and where one is in each. It depends on the sides, their projects and
  // which has the focus. Two sides of one project are one project to the
  // list, at the element of the one with the focus.
  $effect(() => {
    const shown: ShownSide[] = [];
    sides.sides.forEach((spec, i) => {
      if (!isMap(spec)) return;
      const has = i === sides.index;
      const at = spec.at ?? PROJECT;
      const there = shown.find((s) => s.id === spec.project);
      if (there) {
        if (has) Object.assign(there, { at, focused: true });
        return;
      }
      shown.push({ id: spec.project, project: openOf(spec)?.project ?? null, at, focused: has });
    });
    viewing.sides = shown;
    viewing.enter = (id, element) => {
      const spec =
        (active?.project === id ? active : undefined) ?? sides.maps.find((s) => s.project === id);
      if (spec) sideApis.get(spec.key)?.show(element);
    };
    viewing.beside = (id, element) => sides.beside(id, element ?? null);
    viewing.close = closeShown;
    viewing.share = shareProject;
  });

  // ---- the document pane, of the active side's document ----

  /** What the document pane does: see `document-pane.svelte`. Whether it is open, and its tab, are `panes`'. */
  const documentPane = new DocumentPane({
    get key() {
      return active?.key;
    },
    get id() {
      return active?.project ?? '';
    },
    project: () => project,
    ownPane: () => (active?.at ? { at: active.at, mode: active.mode } : undefined),
    holding: (element) => activeApi?.holding(element) ?? PROJECT,
    show: (target) => activeApi?.show(target),
    toText: (target) => {
      if (active && active.at === target && active.mode !== 'text')
        sides.setMode(active.key, 'text');
    },
  });
  provideReviewing({
    get review() {
      return documentPane.review;
    },
  });
  // With no side that shows a project, the document pane has nothing to show,
  // and closes; the Document button of a map side opens it again. It depends
  // on whether a map is shown.
  $effect(() => {
    if (sides.map) return;
    untrack(() => {
      if (panes.document) panes.document = false;
    });
  });

  // A review is not begun as the window opens: the tab of changes kept is left closed.
  if (panes.tab === 'changes') {
    panes.tab = 'references';
    panes.document = false;
  }

  /** A moment of the history looked at, in the active side. */
  const looking = $derived<Looking | null>(documentPane.looking);

  /** The element the document pane is about: that whose changes are reviewed, else the one in view. */
  const sideElement = $derived(
    documentPane.kind === 'history'
      ? undefined
      : project?.node((documentPane.kind === 'changes' && documentPane.review?.at) || at),
  );

  // ---- the typesetting pane, of the side whose button was pressed ----

  /** The side the typesetting pane shows, and its project. It does not follow the focus. */
  const previewSpec = $derived.by(() => {
    const spec = sides.byKey(panes.typesetting);
    return isMap(spec) ? spec : undefined;
  });
  const previewOpen = $derived(previewSpec ? openOf(previewSpec) : undefined);

  /** What the Typesetting button of the active side does: opens the pane for it, turns it to it, or closes it. */
  function togglePreview() {
    if (active) panes.typesetFor(active.key);
  }

  /** The typesetting pane shown, which prints. */
  let previewPanel = $state<PreviewPanel>();

  /**
   * Prints what the side that has the focus shows (record 0075): a file side
   * its file; else the document of the side, the typesetting pane opened for
   * it where it is closed or shows the other side, and its pages waited for.
   */
  async function printActive() {
    const shown = sides.active;
    if (isFile(shown)) return fileSideViews[shown.key]?.print();
    const side = active;
    if (!side) return;
    if (panes.typesetting !== side.key) panes.typesetFor(side.key);
    await tick();
    await previewPanel?.print();
  }

  /** The element the text of the side the typesetting pane shows is at; nothing where it shows no text. */
  function previewCurrent(): string | null {
    const spec = previewSpec;
    if (!spec || spec.mode !== 'text') return null;
    return sideApis.get(spec.key)?.text()?.currentElement() ?? null;
  }

  /** Shows an element of the document the typesetting pane shows, in the text of its side. From the pages and from Look. */
  function toTextOfPreview(element: string) {
    const spec = previewSpec;
    if (spec) sideApis.get(spec.key)?.goTo(element, { mode: 'text' });
  }

  // The look of the document is asked for from elsewhere: a chip on the
  // pages, the foot of the kind menu, the palette. The Look column opens, and
  // the typesetting pane for the active side where it is closed. It depends
  // on the count of the asks alone, and one asked before the window was made
  // is not for it.
  let lookAsked = untrack(() => lookUi.asked);
  $effect(() => {
    const asked = lookUi.asked;
    if (asked === lookAsked) return;
    lookAsked = asked;
    untrack(() => {
      if (active) panes.openLook(active.key);
    });
  });

  // ---- the window, while projects are shown ----

  // Every sharing that has ended from the other side is answered once. It
  // depends on why each ended, which it takes at once.
  $effect(() => {
    for (const open of openProjects.all()) {
      const shared = open.sharing as ProjectSharing | null;
      const why = shared?.ended;
      if (!why || !shared) continue;
      untrack(() => {
        shared.ended = null;
        if (showShare?.id === open.id) showShare = null;
        const fetched = !!open.project?.node(PROJECT);
        if (!fetched) {
          // There is nothing here to keep: it is taken off the list, its sides close, and that
          // it is gone is said once it is, or that it could not be.
          const title = why === 'deleted' ? t('project-unshared') : t('project-left-out');
          sides.closeProject(open.id);
          projects.remove(open.id).then(
            () => notify(title, t('project-unshared-unfetched')),
            (error) => notifyError(t('project-unshared-not-removed'), error),
          );
          return;
        }
        void confirm({
          title: why === 'deleted' ? t('project-unshared-this') : t('project-left-out'),
          message: why === 'deleted' ? t('project-unshared-kept') : t('project-left-out-kept'),
          confirm: t('project-understood'),
          cancel: '',
        });
      });
    }
  });

  // Who works here, as the history knows them: again when they are named
  // anew. It depends on who that is and on the projects open; the projects
  // are told untracked.
  $effect(() => {
    const who = me();
    const all = openProjects.all().map((o) => o.project);
    untrack(() => {
      for (const p of all) p?.setMe(who);
    });
  });

  // For the tests of the running application, which ask the history as the
  // review does: of the active side's project. Only when the harness asks for it.
  $effect(() => {
    const p = project;
    const id = active?.project;
    if (!p || !id) return;
    testHook('__glaukopisHistory', {
      history: historyOf(p, id),
      positions,
      get review() {
        return documentPane.review;
      },
    });
  });

  // The window is named after the project of the active side. It depends on its name.
  $effect(() => {
    const name = project?.name;
    const title = name ? `Glaukopis – ${name}` : 'Glaukopis';
    document.title = title;
    void getCurrentWindow()
      .setTitle(title)
      .catch(() => {});
  });

  // The kinds of paragraph and of words of the writer's own are seen at
  // once: a style sheet in the head of the document sets them from what
  // they are based on (`passageKindsCss`), anew whenever they change. It
  // depends on the kinds of every project open: their ids are their own.
  $effect(() => {
    const kinds = openProjects.all().flatMap((o) => o.project?.passageKinds ?? []);
    const css = passageKindsCss(kinds);
    let sheet = document.getElementById('passage-kinds');
    if (!sheet) {
      sheet = document.createElement('style');
      sheet.id = 'passage-kinds';
      document.head.appendChild(sheet);
    }
    sheet.textContent = css;
  });

  // The images figures show are sent and fetched for the active side's
  // project. It depends on that project.
  $effect(() => {
    const p = project;
    const id = active?.project;
    if (!p || !id) return;
    untrack(() => {
      if (pictures.project === id) return;
      pictures.open(id, () => p.usedPictures());
    });
  });

  // The pictures of a project that is shared are with the others as well:
  // when the connection is there, what either side lacks is sent and fetched,
  // and again when the set of pictures the project uses has changed.
  const usedPictureSet = $derived(project ? pictureSet(project) : '');
  const pictureSync = new PictureSync();
  $effect(() => {
    if (!project) return;
    const shared = activeOpen?.sharing as ProjectSharing | null | undefined;
    pictures.shared = !!shared?.sharing;
    // It depends on the set of pictures, a derived string that tells only
    // when it has become another, and on the connection; a keystroke, which
    // makes the pictures be read again, gives the same set and syncs nothing.
    const synced = !!(shared?.sharing && shared.connection?.synced);
    if (pictureSync.wanted(usedPictureSet, synced)) untrack(() => void pictures.sync());
  });

  onMount(() => {
    library.load();
  });

  onDestroy(() => {
    document.title = 'Glaukopis';
    void getCurrentWindow()
      .setTitle('Glaukopis')
      .catch(() => {});
    document.getElementById('passage-kinds')?.remove();
    aboutDocumentUi.close();
    templateEditorUi.close();
    ownKindsUi.editing = null;
    documentPane.review?.close();
    comparing.copy = null;
    openProjects.onopened = null;
    viewing.sides = [];
    viewing.enter = null;
    viewing.beside = null;
    viewing.close = null;
    viewing.share = null;
    pictures.open(null);
  });

  /** When the user turns to something else, what is there is put in order on disk. */
  function onblur() {
    void openProjects.snapshotAll();
  }

  /**
   * Alt+Shift+Up goes up from anywhere in the active side, the text as
   * well, with the cursor in a name or a text; not from a field, or from the
   * box of an element in the diagram, which is written in over the map.
   */
  function onkeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.key !== 'ArrowUp' || !event.altKey) return;
    if (event.ctrlKey || event.metaKey || !event.shiftKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('input, textarea, select')) return;
    const writing = target?.closest?.('[contenteditable="true"], .prose');
    if (writing && !writing.closest('.text-view')) return;
    if (!mapFocused) return;
    event.preventDefault();
    activeApi?.up();
  }

  // ---- the sides ----

  /** Closes a side, by its × or by Ctrl+W; with none left, the start screen comes. */
  function closeSideOf(key: string) {
    panes.sideGone(key);
    sides.close(key);
  }

  /** The sides that show a project close, as Close in the list's menu of a project asks. */
  function closeShown(id: string) {
    for (const spec of sides.maps.filter((s) => s.project === id)) closeSideOf(spec.key);
  }

  /** One side again: the side without the focus closes. */
  function oneAtATime() {
    const other = sides.sides.find((_, i) => i !== sides.index);
    if (other) closeSideOf(other.key);
  }

  /** Another element of the active side's project, chosen in its tree, in the other side. */
  async function besideElement() {
    if (!project || !active) return;
    const id = await pickElement(project, {
      title: t('project-beside-element-title'),
      action: t('project-beside-show'),
      at: active.at ?? undefined,
    });
    if (id) sides.beside(active.project, id);
  }

  let sideBySideButton = $state<HTMLButtonElement>();
  /** Whether the chooser of a file of the library to show beside is open. */
  let choosingFile = $state(false);
  /**
   * The files among the tabs Split view's chooser adds to, not offered again:
   * of the file side there is, else of the project of the active side.
   */
  function tabbedFiles(): string[] {
    const there = sides.sides.find(isFile);
    if (there) return sides.tabs(there.key).tabs.map((tab) => tab.file);
    const map = sides.active;
    return isMap(map) ? sourcesStore.of(map.project).tabs.map((tab) => tab.file) : [];
  }
  /** Whether the chooser of another project to show beside is open. */
  let choosingBeside = $state(false);

  /** The menu of Split view: what the other side shows, switching the sides, and one side again. */
  function sideBySideMenu() {
    if (!sideBySideButton || !sides.active) return;
    const items: MenuItem[] = [
      {
        label: t('project-beside-this'),
        icon: Columns2,
        disabled: !mapFocused,
        action: () => sides.bothWays(),
      },
      {
        label: t('project-beside-element'),
        icon: ListTree,
        disabled: !mapFocused,
        action: () => void besideElement(),
      },
      {
        label: t('project-beside-project'),
        icon: FolderTree,
        action: () => (choosingBeside = true),
      },
      {
        label: t('project-beside-tabs'),
        icon: PanelRight,
        action: () => sides.showTabs(),
      },
      {
        label: t('project-beside-file'),
        icon: FileText,
        action: () => (choosingFile = true),
      },
    ];
    if (sides.sides.length > 1)
      items.push(
        { kind: 'separator' },
        {
          label: t('project-switch-sides'),
          icon: ArrowLeftRight,
          action: () => sides.switchSides(),
        },
        { label: t('project-one-at-a-time'), icon: X, action: oneAtATime },
      );
    openMenu(sideBySideButton, items, { align: 'start' });
  }

  /** Shows a project in a side, at its top or at an element of it, as it is chosen in the tree of all projects of the side's path. */
  function projectIn(spec: SideSpec, id: string, at?: string) {
    if (isMap(spec) && spec.project === id) {
      sideApis.get(spec.key)?.show(at ?? PROJECT);
      return;
    }
    sides.focus(spec.key);
    sides.open(id, at ?? PROJECT);
  }

  /** The file sides as they are drawn, by their keys: Ctrl+W closes the tab one shows. */
  const fileSideViews: Record<string, FileSide | undefined> = {};

  /** Shows a file of the library in a side, as its tree chooses it: as a tab, or the side made a file side (ADR 0072). */
  function fileIn(spec: SideSpec, hash: string) {
    sides.showFileIn(spec.key, hash);
  }

  /** The project of a side, as the list has it, for its path: the folder it lies in. */
  function infoOf(spec: MapSide, of: Project): ProjectInfo {
    return (
      projects.list.find((x) => x.id === spec.project) ??
      openOf(spec)?.info ?? {
        id: spec.project,
        name: of.name,
        description: '',
        created: '',
        modified: '',
        maps: [],
        words: 0,
        references: 0,
      }
    );
  }

  /** How the project of a side is shared, and how it is connected, for the badge of its path. */
  function sharingOf(
    spec: SideSpec,
  ): { owner: boolean; status: 'connected' | 'offline' | 'refused' } | null {
    const shared = openOf(spec)?.sharing as ProjectSharing | null | undefined;
    const sharing = shared?.sharing;
    if (!sharing) return null;
    const connection = shared?.connection;
    const status = connection?.tooLarge
      ? 'refused'
      : connection?.status === 'connected'
        ? 'connected'
        : 'offline';
    return { owner: sharing.owner, status };
  }

  /** The sharing window, while it is open, for a project. */
  let showShare = $state<OpenProject | null>(null);
  /** The project whose sharing window is to open once it is open. */
  let sharingWanted = $state<string | null>(viewing.shareWanted);
  viewing.shareWanted = null;

  /**
   * Share… in the menu of a project in the list: the sharing window of a
   * project shown in a side; one that is not is opened in the active side
   * first, since the sharing needs the project open.
   */
  function shareProject(id: string) {
    if (!sides.maps.some((s) => s.project === id)) sides.open(id);
    sharingWanted = id;
  }

  // The sharing window opens once its project is open, with what it is
  // shared by. It depends on the project asked for and on its state.
  $effect(() => {
    const id = sharingWanted;
    if (!id) return;
    const open = openProjects.get(id);
    if (open?.state === 'failed') sharingWanted = null;
    if (open?.state !== 'open' || !open.sharing || !open.project) return;
    untrack(() => {
      showShare = open;
      sharingWanted = null;
    });
  });

  // ---- the top row: a cell over each side, as wide as it ----

  let panesEl = $state<HTMLDivElement>();
  /** The widths of the sides, and of the row of them, as drawn. */
  let paneWidths = $state.raw<number[]>([]);
  let panesWidth = $state(0);
  /** What stands between the cells: the width of the line between the sides. */
  const between = $derived(
    paneWidths.length > 1 ? Math.max(0, panesWidth - paneWidths[0] - paneWidths[1]) : 0,
  );

  // The sides are measured as they change width. It depends on the elements
  // of the sides and on how many there are.
  $effect(() => {
    const box = panesEl;
    const els = sides.sides
      .map(
        (s) =>
          sideApis.get(s.key)?.el ??
          panesEl?.querySelector<HTMLElement>(`[data-side-key="${s.key}"]`) ??
          undefined,
      )
      .filter((el): el is HTMLElement => !!el);
    if (!box) return;
    const measure = () => {
      paneWidths = els.map((el) => el.getBoundingClientRect().width);
      panesWidth = box.getBoundingClientRect().width;
    };
    // A frame later, so that the cells changing width is not a change within the observing.
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(box);
    for (const el of els) observer.observe(el);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });

  // ---- the room each part has ----

  let work = $state<HTMLDivElement>();
  /** The pages of the typesetting pane, its Look column, and the document pane, as drawn. */
  let previewEl = $state<HTMLDivElement>();
  let lookEl = $state<HTMLDivElement>();
  let referencesEl = $state<HTMLDivElement>();

  function moveSplit(dx: number) {
    const width = panesEl?.offsetWidth ?? 0;
    // Where the sides are switched, the first stands at the right: the line follows the pointer still.
    if (width) sides.split = clamp(sides.split + (sides.mirrored ? -dx : dx) / width, 0.2, 0.8);
  }

  /** The panes are measured when the dragging begins: until then they have what they are given. */
  function measure(which: 'preview' | 'look' | 'references') {
    const el = which === 'preview' ? previewEl : which === 'look' ? lookEl : referencesEl;
    if (!el) return;
    if (which === 'preview' && !panes.typesettingWidth) panes.typesettingWidth = el.offsetWidth;
    if (which === 'look' && !panes.lookWidth) panes.lookWidth = el.offsetWidth;
    if (which === 'references' && !panes.documentWidth) panes.documentWidth = el.offsetWidth;
  }

  function moveSide(which: 'preview' | 'look' | 'references', dx: number) {
    const room = work?.offsetWidth ?? 1200;
    if (which === 'preview')
      panes.typesettingWidth = sideWidth(which, panes.typesettingWidth, dx, room);
    else if (which === 'look') panes.lookWidth = sideWidth('references', panes.lookWidth, dx, room);
    else panes.documentWidth = sideWidth(which, panes.documentWidth, dx, room);
  }

  /** How wide the typesetting pane is: its pages, as dragged or as given, and its Look column where it is open. */
  const typesettingWidth = $derived.by(() => {
    const pages = panes.typesettingWidth ? `${panes.typesettingWidth}px` : 'min(46%, 640px)';
    return panes.look ? `calc(${pages} + ${panes.lookWidth || 340}px + 1px)` : pages;
  });

  // ---- what the panel and the keys ask of the active side ----

  let host = $state<ReturnType<typeof EditorHost>>();

  function keep(id: string) {
    host?.keep(id);
  }

  /**
   * Begins a comment: on the passage that is selected in the text, or on
   * the element the cursor is in; or on the element selected in the diagram.
   */
  function beginComment() {
    const view = editorUi.selection?.view;
    const element = view ? hooksOf.get(view)?.element : undefined;
    if (view && element && view.hasFocus()) {
      commentsUi.begin(element, selectedPassage(view));
      return;
    }
    const chosen = activeApi?.diagram()?.chosen() ?? [];
    if (chosen.length === 1) commentsUi.begin(chosen[0]);
  }

  // What is asked of the document pane from elsewhere (the comments, the
  // citations found, the images) is answered, and the review follows the
  // element in view: the effects are those of `document-pane.svelte`.
  documentPane.follow();

  /**
   * How many citations that were found the element in view has left, for
   * the tab of their panel. It depends on the shape of the branch and on the
   * record of each element in it (what `countFound` reads).
   */
  const foundCount = $derived(project ? countFound(project, at) : 0);

  /** Shows a citation that was found where a side shows the element in view as text: scrolled to, and selected. */
  function showFound(element: string, entry: Entry) {
    for (const spec of sides.maps) {
      if (spec.project !== active?.project || spec.at !== element || spec.mode !== 'text') continue;
      const surface = sideApis.get(spec.key)?.text()?.searchSurface();
      if (surface) void revealFound(surface, entry.target, entry.element);
    }
  }

  // The keys of a project, while one is shown: see `shell/keys`. They act in the active side.
  onMount(() => {
    const reviewing = () => !!documentPane.review;
    const shown = () => !!active;
    /** The keys of the tree, the views and writing: only while a side that shows a project has the focus. */
    const onMap = () => !!active && mapFocused;
    return shortcuts.bind({
      'diagram-or-text': {
        run: () => {
          if (active) sides.setMode(active.key, active.mode === 'diagram' ? 'text' : 'diagram');
        },
        when: onMap,
      },
      preview: { run: togglePreview, when: shown },
      print: { run: () => void printActive(), when: () => !!sides.active },
      'document-settings': {
        run: () => {
          if (project) aboutDocumentUi.open({ project, at });
        },
        when: () => !!project,
      },
      'what-document': {
        run: () => {
          if (project) aboutDocumentUi.open({ project, at, section: 'type' });
        },
        when: () => !!project,
      },
      'projects-pane': toggleProjectsPane,
      'side-look': {
        run: () => {
          if (active) panes.toggleLook(active.key);
        },
        when: shown,
      },
      'look-type': () => lookUi.open({ section: 'type' }),
      'side-references': () => documentPane.show('references'),
      // Not Ctrl+Shift+I, which the window keeps for itself while the application is being developed.
      'side-pictures': () => documentPane.show('images'),
      'side-comments': () => documentPane.show('comments'),
      'side-found': () => documentPane.show('found'),
      comment: { run: beginComment, when: () => !!project && mapFocused },
      'side-history': () => documentPane.show('history'),
      'side-changes': () => documentPane.toggleReview(),
      'side-panel': () => panes.toggleDocument(),
      'side-by-side': sideBySideMenu,
      // On a file side, the tab shown closes first, and the side with its last (ADR 0072).
      'close-side': {
        run: () => {
          const side = sides.active;
          if (!side) return;
          const shown = isFile(side) ? fileSideViews[side.key] : undefined;
          if (shown) shown.closeShown();
          else closeSideOf(side.key);
        },
        when: () => !!sides.active,
      },
      'switch-sides': { run: () => sides.switchSides(), when: () => sides.sides.length > 1 },
      'writing-marks': () => (panes.marks = !panes.marks),
      'text-outline': {
        run: () => {
          if (active) sides.toggleOutline(active.key);
        },
        when: onMap,
      },
      find: { run: () => activeApi?.find(false), when: onMap },
      replace: { run: () => activeApi?.find(true), when: onMap },
      // The keys act in the project of the active side.
      undo: { run: () => project?.undo(), when: () => !!project && mapFocused },
      redo: { run: () => project?.redo(), when: () => !!project && mapFocused },
      'redo-y': { run: () => project?.redo(), when: () => !!project && mapFocused },
      'review-next': { run: () => documentPane.review?.next(), when: reviewing },
      'review-previous': { run: () => documentPane.review?.previous(), when: reviewing },
      'review-accept': { run: () => void documentPane.review?.accept(), when: reviewing },
      'review-reject': { run: () => void documentPane.review?.reject(), when: reviewing },
    });
  });
</script>

<!-- Alt+Shift+Up is a key of the whole window, like those of `shell/keys`, which cannot hold an arrow. -->
<svelte:window {onblur} {onkeydown} />

<div class="project">
  <!-- the top row: over each side a cell with its path and its ×, as wide as the side, and on the join of two the button that switches them; Split view at the right end. The list's button is on the rail. -->
  <div class="top" data-top>
    <div
      class="cells"
      class:mirrored={sides.mirrored}
      style:gap="{between / 2}px"
      style:flex-basis="{panesWidth}px"
    >
      {#each sides.sides as spec, i (spec.key)}
        {@const of = openOf(spec)?.project}
        {#if i === 1}
          <!-- On the join of the two cells, over the line between the sides. -->
          <div class="join">
            <button
              type="button"
              class="switch"
              aria-label={t('project-switch-sides')}
              data-switch-sides
              use:tooltip={{ text: t('project-switch-sides'), side: 'bottom' }}
              onclick={() => sides.switchSides()}
            >
              <ArrowLeftRight size={13} />
            </button>
          </div>
        {/if}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="cell"
          class:active={sides.sides.length > 1 && i === sides.index}
          class:other={sides.sides.length > 1 && i !== sides.index}
          class:before-join={sides.sides.length > 1 && i === (sides.mirrored ? 1 : 0)}
          class:after-join={sides.sides.length > 1 && i === (sides.mirrored ? 0 : 1)}
          data-side={i}
          style:flex-basis="{paneWidths[i] ?? 0}px"
          style:flex-shrink={i === (sides.mirrored ? 0 : sides.sides.length - 1) ? 1 : 0}
          onpointerdowncapture={() => sides.focus(spec.key)}
          onfocusin={() => sides.focus(spec.key)}
        >
          {#if !isMap(spec)}
            <FilePath
              {spec}
              onproject={(id, element) => projectIn(spec, id, element)}
              onfile={(hash) => fileIn(spec, hash)}
            />
          {:else if of && of.node(PROJECT) && spec.at}
            <Path
              project={of}
              info={infoOf(spec, of)}
              at={spec.at}
              sharing={sharingOf(spec)}
              status={of.status === 'error' ? 'error' : 'saved'}
              fault={of.saveError ?? undefined}
              onselect={(id) => sideApis.get(spec.key)?.show(id)}
              onproject={(id, element) => projectIn(spec, id, element)}
              onfile={(hash) => fileIn(spec, hash)}
            />
          {/if}
          <!-- At the right end of the cell: the path gives way, the × stays. With one side, closing it brings the start screen. -->
          <span class="close">
            <IconButton
              label={t('project-close-side')}
              shortcut={keysFor('close-side')}
              size="sm"
              data-close-side
              onclick={() => closeSideOf(spec.key)}
            >
              <X size={14} />
            </IconButton>
          </span>
        </div>
      {/each}
    </div>
    <div class="split">
      <!-- Lit while two sides are shown; its menu chooses what the other side shows. -->
      <button
        type="button"
        class="tool"
        class:on={sides.sides.length > 1}
        bind:this={sideBySideButton}
        aria-haspopup="menu"
        aria-label={t('project-side-by-side')}
        data-side-by-side
        use:tooltip={{
          text: t('project-side-by-side'),
          shortcut: keysFor('side-by-side'),
          side: 'bottom',
        }}
        onclick={sideBySideMenu}
      >
        <Columns2 size={15} />
        <span>{t('project-side-by-side-short')}</span>
      </button>
    </div>
  </div>
  <!-- /the top row -->
  {#if active && project}
    <WordsBar {project} />
  {/if}

  <div class="work" bind:this={work}>
    <div
      class="panes"
      class:two={sides.sides.length > 1}
      class:across={sides.across}
      class:mirrored={sides.mirrored}
      bind:this={panesEl}
    >
      {#each sides.sides as spec, i (spec.key)}
        {#if i === 1}
          <Divider
            label={t('project-between-maps')}
            onmove={moveSplit}
            onreset={() => (sides.split = 0.5)}
          />
        {/if}
        {@const otherSpec = sides.sides[1 - i]}
        {@const grow = sides.sides.length > 1 ? (i === 0 ? sides.split : 1 - sides.split) : 1}
        {#if isMap(spec)}
          <SideView
            {spec}
            index={i}
            count={sides.sides.length}
            active={i === sides.index}
            other={isMap(otherSpec) && otherSpec.project !== spec.project
              ? (openOf(otherSpec)?.project ?? null)
              : null}
            {grow}
            looking={i === sides.index ? looking : null}
            onlooked={() => (documentPane.looking = null)}
            onclose={() => closeSideOf(spec.key)}
          />
        {:else}
          <FileSide
            bind:this={fileSideViews[spec.key]}
            {spec}
            count={sides.sides.length}
            active={i === sides.index}
            {grow}
            onclose={() => closeSideOf(spec.key)}
          />
        {/if}
      {/each}
    </div>

    <!-- the typesetting pane -->
    {#if previewSpec && previewOpen?.project && previewSpec.at}
      {@const of = previewOpen?.project as Project}
      {@const typesetAt = previewSpec?.at ?? PROJECT}
      <Divider
        label={t('project-between-preview')}
        onstart={() => measure('preview')}
        onmove={(dx) => moveSide('preview', dx)}
        onreset={() => (panes.typesettingWidth = 0)}
      />
      <!-- Of the side whose Typesetting button was pressed, not of the focus. -->
      <div
        class="side typesetting"
        data-typesetting={previewSpec?.key}
        style:width={typesettingWidth}
      >
        <div class="pages-part" bind:this={previewEl}>
          <!-- Of the project of the side it shows: made anew when that is another. -->
          {#key previewSpec?.project}
            <PreviewPanel
              bind:this={previewPanel}
              project={of}
              projectId={previewSpec?.project ?? ''}
              at={typesetAt}
              look={panes.look}
              onlook={() => {
                if (previewSpec) panes.toggleLook(previewSpec.key);
              }}
              onclose={() => panes.closeTypesetting()}
              ongo={toTextOfPreview}
              current={previewCurrent}
            />
          {/key}
        </div>
        {#if panes.look}
          <Divider
            label={t('look-between')}
            onstart={() => measure('look')}
            onmove={(dx) => moveSide('look', dx)}
            onreset={() => (panes.lookWidth = 0)}
          />
          <div
            class="look-column"
            bind:this={lookEl}
            style:width={panes.lookWidth ? `${panes.lookWidth}px` : undefined}
          >
            <!-- The look of the document the pages show. -->
            {#key `${previewSpec?.project}\n${typesetAt}`}
              <LookPanel
                project={of}
                at={typesetAt}
                passageKinds={of.passageKinds}
                ongo={toTextOfPreview}
                onclose={() => (panes.look = false)}
                current={previewCurrent}
              />
            {/key}
          </div>
        {/if}
      </div>
    {/if}
    <!-- /the typesetting pane -->
    <!-- the document pane -->
    {#if documentPane.kind && project && active}
      {@const kind = documentPane.kind}
      {@const shared = activeOpen?.sharing as ProjectSharing | null | undefined}
      {#snippet tabs()}
        <SideTabs
          current={kind}
          counts={{ found: foundCount }}
          onpick={(tab) => documentPane.show(tab, true)}
        />
      {/snippet}
      <Divider
        label={kind === 'images'
          ? t('project-between-pictures')
          : kind === 'history'
            ? t('history-between')
            : kind === 'comments'
              ? t('comments-between')
              : kind === 'found'
                ? t('found-between')
                : t('project-between-references')}
        onstart={() => measure('references')}
        onmove={(dx) => moveSide('references', dx)}
        onreset={() => (panes.documentWidth = 0)}
      />
      <div
        class="side"
        data-document-pane
        bind:this={referencesEl}
        style:width={panes.documentWidth ? `${panes.documentWidth}px` : undefined}
      >
        {#if sideElement || (shared?.connection && project?.others.length)}
          <div class="side-map" class:split={sides.sides.length > 1}>
            {#if sideElement}
              <!-- While a file has the focus, the pane is of the map in the other side, and says so. -->
              <span class="overline" data-document-of-other={!mapFocused || undefined}
                >{mapFocused ? t('project-side-map') : t('project-document-of-other')}</span
              >
              <!-- Where two projects are shown, which one the pane is about. -->
              {#if sides.across}
                <span class="of" data-side-project>{project?.name}</span>
                <span class="sep" aria-hidden="true">›</span>
              {/if}
              <strong>{sideElement.title || t('project-untitled')}</strong>
            {/if}
            <span class="grow"></span>
            <!-- Who else is in the project: a small sign, the names on hover. -->
            {#if shared?.connection}
              <Presence people={project?.others ?? []} compact />
            {/if}
          </div>
        {/if}
        {#if kind === 'changes' && documentPane.review}
          <ReviewPanel
            review={documentPane.review}
            head={tabs}
            onclose={() => documentPane.close()}
          />
        {:else if kind === 'history'}
          <HistoryPanel
            {project}
            history={historyOf(project, active?.project ?? '')}
            looking={documentPane.looking}
            pane={sides.index}
            onlook={(l) => (documentPane.looking = l)}
            head={tabs}
            onclose={() => documentPane.close()}
          />
        {:else if kind === 'comments'}
          <CommentsPanel
            {project}
            {at}
            head={tabs}
            onclose={() => documentPane.close()}
            ongo={(element) => activeApi?.goTo(element)}
            onopen={(element) => {
              // In the diagram, where the element is within view, its box opens; else the text is gone to.
              if (active?.mode === 'diagram' && activeApi?.holding(element) === at)
                activeApi?.diagram()?.write(element);
              else activeApi?.goTo(element, { mode: 'text' });
            }}
          />
        {:else if kind === 'found'}
          {#key `${active?.project}:${at}`}
            <FoundPanel
              {project}
              {at}
              head={tabs}
              onclose={() => documentPane.close()}
              onkeep={keep}
              onshow={(entry) => showFound(at, entry)}
            />
          {/key}
        {:else if kind === 'images'}
          <PicturePanel
            {project}
            {at}
            bind:scope={documentPane.pictureScope}
            head={tabs}
            onclose={() => documentPane.close()}
            onenter={(id) => activeApi?.show(id)}
          />
        {:else}
          <ReferencePanel
            {project}
            {at}
            head={tabs}
            onclose={() => documentPane.close()}
            show={documentPane.citationsOf}
            ongo={(element) => activeApi?.goTo(element)}
          />
        {/if}
      </div>
    {/if}
    <!-- /the document pane -->
  </div>
</div>

{#if project}
  {#key active?.project}
    <EditorHost bind:this={host} {project} />
  {/key}
{/if}
<DocumentHost />

<!-- What is asked from the menu of an element is done in the project of the active side. -->
<ProjectDialogs
  {project}
  focused={project}
  at={active?.at ?? undefined}
  ongo={(element) => activeApi?.goTo(element)}
/>

{#if choosingFile}
  <FileChooser
    title={t('project-beside-file-title')}
    kinds={['pdf', 'picture']}
    except={tabbedFiles()}
    onpick={(hashes) => hashes.forEach((hash) => sides.showFile(hash))}
    onclose={() => (choosingFile = false)}
  />
{/if}

{#if choosingBeside && sides.active}
  <BesideDialog
    current={active?.project ?? ''}
    onchoose={(id, element) => sides.beside(id, element ?? null)}
    onclose={() => (choosingBeside = false)}
  />
{/if}

{#if showShare?.sharing && showShare.project}
  <SharePanel
    shared={showShare.sharing as ProjectSharing}
    projectId={showShare.id}
    projectName={showShare.project.name}
    onclose={() => (showShare = null)}
  />
{/if}

<style>
  .project {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  /* The top row: the paths of the sides, and Split view. */
  .top {
    display: flex;
    align-items: stretch;
    height: var(--bar-h);
    flex: none;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .cells {
    display: flex;
    flex: 0 1 auto;
    min-width: 0;
  }
  .cells.mirrored,
  .panes.mirrored {
    flex-direction: row-reverse;
  }
  /* Where Split view needs room, the cell at the right gives way, so that the line between the cells stays over that between the sides. */
  .cell {
    display: flex;
    align-items: center;
    flex-grow: 0;
    min-width: 0;
    padding: 0 6px 0 8px;
    overflow: hidden;
  }
  /* Of two sides, that with the focus in the accent, with the accent's ink for all in it; the other sunken and grey. */
  .cell.active {
    background: var(--accent);
    color: var(--accent-ink);
    --ink: var(--accent-ink);
    --ink-2: var(--accent-ink);
    --ink-3: color-mix(in srgb, var(--accent-ink) 78%, transparent);
    --ink-4: color-mix(in srgb, var(--accent-ink) 55%, transparent);
    --paper-hover: color-mix(in srgb, var(--accent-ink) 14%, transparent);
    --line: color-mix(in srgb, var(--accent-ink) 30%, transparent);
  }
  .cell.other {
    background: var(--paper-sunken);
    color: var(--ink-3);
    --ink: var(--ink-3);
    --ink-2: var(--ink-3);
  }
  .split {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1 0 auto;
    padding: 0 10px 0 8px;
  }
  .close {
    display: flex;
    flex: none;
    margin-left: auto;
    padding-left: 4px;
  }
  /* Where two sides are shown, the cells leave room on the join for the button that switches them. */
  .cell.before-join {
    padding-right: 16px;
  }
  .cell.after-join {
    padding-left: 18px;
  }
  .join {
    position: relative;
    flex: 0 0 0;
    width: 0;
    z-index: 2;
  }
  .switch {
    position: absolute;
    top: 50%;
    left: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    transform: translate(-50%, -50%);
    border: 1px solid var(--line-strong);
    border-radius: 50%;
    background: var(--paper-raised);
    color: var(--ink-3);
    cursor: pointer;
    box-shadow: var(--shadow-1);
  }
  .switch:hover {
    color: var(--ink);
    border-color: var(--accent);
  }
  .tool {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: none;
    height: 28px;
    padding: 0 9px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper-sunken);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .tool:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .tool.on {
    background: var(--accent-soft);
    border-color: color-mix(in srgb, var(--accent) 35%, transparent);
    color: var(--accent-strong);
  }
  .work {
    flex: 1;
    min-height: 0;
    display: flex;
  }
  .panes {
    flex: 1;
    min-width: 240px;
    display: flex;
  }
  /* Two projects side by side: the line between them is doubled. */
  .panes.across > :global(.divider) {
    width: 5px;
    background: transparent;
    border-left: 1px solid var(--line-strong);
    border-right: 1px solid var(--line-strong);
  }
  .panes.across > :global(.divider)::after {
    left: 1px;
  }
  .side {
    display: flex;
    flex-direction: column;
    width: 340px;
    max-width: 70%;
    flex: none;
    min-height: 0;
  }
  .side > :global(.panel) {
    flex: 1;
    min-height: 0;
  }
  /* Which element the panel is about, as the head of the pane in view is marked. */
  .side-map {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex: none;
    min-width: 0;
    padding: 5px 16px;
    border-bottom: 1px solid var(--line);
    background: var(--paper-raised);
    font-size: var(--text-sm);
  }
  .side-map.split {
    background: var(--accent-softer);
  }
  .side-map .of {
    font-weight: 600;
    white-space: nowrap;
  }
  .side-map .sep {
    color: var(--ink-4);
  }
  .side-map strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .side-map .grow {
    flex: 1;
  }
  /* The typesetting pane: its pages, and its Look column beside them. */
  .side.typesetting {
    flex-direction: row;
    max-width: 85%;
  }
  .pages-part {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
  .pages-part > :global(.preview) {
    flex: 1;
    min-height: 0;
  }
  .look-column {
    display: flex;
    flex-direction: column;
    flex: none;
    width: 340px;
    min-height: 0;
  }
  .look-column > :global(.panel) {
    flex: 1;
    min-height: 0;
  }
</style>

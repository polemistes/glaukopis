<script module lang="ts">
  import type { Project } from './model/project.svelte';

  /**
   * What the pane of projects, which stands outside the view and lasts from
   * one project to the next, is told of the one that is open: the project,
   * the element in view of the pane that has the focus, and how an element
   * is entered; and how another project, or an element of it, is opened
   * beside, in the second pane. Nothing while no project is open.
   */
  class Viewing {
    project = $state.raw<Project | null>(null);
    at = $state<string | null>(null);
    enter: ((id: string) => void) | null = null;
    beside: ((projectId: string, at?: string) => void) | null = null;
  }

  export const viewing = new Viewing();
</script>

<script lang="ts">
  import WordsBar from '$lib/words/WordsBar.svelte';
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import BookOpenText from '@lucide/svelte/icons/book-open-text';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import CloudDownload from '@lucide/svelte/icons/cloud-download';
  import Columns2 from '@lucide/svelte/icons/columns-2';
  import FileText from '@lucide/svelte/icons/file-text';
  import Network from '@lucide/svelte/icons/network';
  import PanelLeft from '@lucide/svelte/icons/panel-left';
  import PanelRight from '@lucide/svelte/icons/panel-right';
  import Redo2 from '@lucide/svelte/icons/redo-2';
  import Undo2 from '@lucide/svelte/icons/undo-2';
  import Users from '@lucide/svelte/icons/users';
  import X from '@lucide/svelte/icons/x';
  import { projectSaveView } from '$lib/api/projects';
  import { Folding } from './text/folding.svelte';
  import Presence from '$lib/sharing/Presence.svelte';
  import SharePanel from '$lib/sharing/SharePanel.svelte';
  import { ProjectSharing } from '$lib/sharing/sharing.svelte';
  import { bringIn, chooseDocument } from '$lib/documents/bringing.svelte';
  import DocumentHost from '$lib/documents/DocumentHost.svelte';
  import { foundUi, goThrough, takeWaiting } from '$lib/found/found.svelte';
  import FoundPanel from '$lib/found/FoundPanel.svelte';
  import { countFound } from '$lib/found/gather';
  import type { Entry } from '$lib/found/going.svelte';
  import { revealFound } from '$lib/found/reveal';
  import { pictures } from '$lib/figures/pictures.svelte';
  import { picturesUi, type PictureScope } from '$lib/pictures/store.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import { drag, dropTarget } from '$lib/ui/drag.svelte';
  import { notify, notifyError } from '$lib/ui/toast.svelte';
  import CommentsPanel from '$lib/comments/CommentsPanel.svelte';
  import { selectedPassage } from '$lib/comments/marks';
  import { commentsUi } from '$lib/comments/ui.svelte';
  import EditorHost from '$lib/editor/EditorHost.svelte';
  import { passageKindsCss } from '$lib/editor/kinds';
  import { ownKindsUi } from '$lib/editor/own-kinds.svelte';
  import { editorUi, hooksOf } from '$lib/editor/ui.svelte';
  import { beforeClose } from '$lib/state/closing';
  import { library } from '$lib/state/library.svelte';
  import { openProject, projects } from '$lib/state/projects.svelte';
  import { jumpFor } from '$lib/search/everything.svelte';
  import { takeCitations } from '$lib/library/citing.svelte';
  import { router, type MapMode } from '$lib/state/router.svelte';
  import { upFromProject } from '$lib/home/list.svelte';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { shortcuts } from '$lib/shell/keys.svelte';
  import { toggleProjectsPane } from '$lib/home/list.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import Divider from '$lib/ui/Divider.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { t } from '$lib/i18n';
  import type { Camera } from './diagram/camera';
  import MapDiagram from './diagram/MapDiagram.svelte';
  import { comparing } from './copies.svelte';
  import CopyDialog from './CopyDialog.svelte';
  import KindDialog from './KindDialog.svelte';
  import PassageKindDialog from './PassageKindDialog.svelte';
  import TimelineView from '$lib/timeline/TimelineView.svelte';
  import Outline from './text/Outline.svelte';
  import { outlineItems } from './outline';
  import WhenDialog from '$lib/timeline/WhenDialog.svelte';
  import { whenUi } from '$lib/timeline/when.svelte';
  import Clock from '@lucide/svelte/icons/clock';
  import KindsDialog from './KindsDialog.svelte';
  import { kindsUi } from './kinds.svelte';
  import { filesDropped, mapOfIt } from './drops';
  import type { ElementsPayload } from './elements';
  import { closedHere, openHere } from './elsewhere';
  import type { ProjectInfo } from '$lib/api/projects';
  import { recordOf } from '$lib/editor/references.svelte';
  import { libraryGet } from '$lib/api/library';
  import {
    arranged,
    clamp,
    guestMode,
    sideWidth,
    toStore,
    type Pane,
    type Sizes,
    type StoredView,
    GIVEN,
  } from './layout';
  import MapBar from './MapBar.svelte';
  import WritingTools from '$lib/editor/WritingTools.svelte';
  import ListTree from '@lucide/svelte/icons/list-tree';
  import { PROJECT } from './model/types';
  import PicturePanel from './PicturePanel.svelte';
  import ReferencePanel from './ReferencePanel.svelte';
  import SideTabs, { type SideKind } from './SideTabs.svelte';
  import MapText from './text/MapText.svelte';
  import PreviewPanel from '$lib/preview/PreviewPanel.svelte';
  import { documents } from '$lib/preview/documents.svelte';
  import LookPanel from '$lib/look/LookPanel.svelte';
  import { lookUi } from '$lib/look/look.svelte';
  import type { Template } from '$lib/api/templates';
  import DocumentSettingsWindow from '$lib/document/DocumentSettingsWindow.svelte';
  import { documentSettingsUi } from '$lib/document/document-settings.svelte';
  import TemplateEditor from '$lib/document/TemplateEditor.svelte';
  import { templateEditorUi } from '$lib/document/template-editor.svelte';
  import { historyOf } from '$lib/history/history.svelte';
  import { me } from '$lib/history/me.svelte';
  import * as positions from '$lib/history/positions';
  import HistoryPanel from '$lib/history/HistoryPanel.svelte';
  import PastView from '$lib/history/PastView.svelte';
  import type { Looking } from '$lib/history/looking';
  import { provideReviewing } from '$lib/review/context';
  import { Review } from '$lib/review/review.svelte';
  import ReviewPanel from '$lib/review/ReviewPanel.svelte';
  import { sourceFor } from '$lib/review/source';

  let { projectId }: { projectId: string } = $props();

  let project = $state<Project | null>(null);
  let failure = $state<string | null>(null);
  let panes = $state<Pane[]>([]);
  let focused = $state(0);
  let cameras = $state<Record<string, Camera>>({});
  /** What the panel at the side shows: one thing at a time, in the one place. */
  let sideKind = $state<SideKind | null>(null);
  let lastSide = $state<SideKind>('references');
  let showOutline = $state(false);
  /** A moment of the history that is looked at, in place of the map as it is. */
  let looking = $state.raw<Looking | null>(null);
  /** Which pictures the panel shows. */
  let pictureScope = $state<PictureScope>('project');
  let showPreview = $state(false);
  let sizes = $state<Sizes>({ ...GIVEN });
  let work = $state<HTMLDivElement>();
  let previewEl = $state<HTMLDivElement>();
  let referencesEl = $state<HTMLDivElement>();
  let host = $state<ReturnType<typeof EditorHost>>();
  /** An element to show when a pane turns to it by a jump. */
  let reveal = $state<string | null>(null);
  /** A reference to show at the references, with where it is cited, as the library asked. */
  let citationsOf = $state<string | null>(null);
  let release: (() => void) | undefined;
  let shared = $state<ProjectSharing | null>(null);
  let showShare = $state(false);
  /** What was kept of the view, until there is a project to show. */
  let stored: StoredView = {};
  /** What is folded away in the text: as it was left, for the whole project, whatever is in view. */
  let folding = $state.raw(new Folding());
  /** The texts in the panes, where a pane shows the text: to be searched. */
  let texts = $state<(ReturnType<typeof MapText> | undefined)[]>([]);
  /** The element at the top of the text of each pane, for the outline. */
  let tops = $state<(string | null)[]>([]);
  const OUTLINE_WIDTH = 240;
  /** How wide the outline stands, as it was last dragged. */
  let outlineWidth = $state(OUTLINE_WIDTH);
  /** The elements of the panes, within which the writing tools find their editor. */
  let paneEls = $state<(HTMLDivElement | undefined)[]>([]);
  /** The diagrams in the panes, where a pane shows the diagram. */
  let diagrams = $state<(ReturnType<typeof MapDiagram> | undefined)[]>([]);

  /** The pane that has the focus, whichever project it shows. */
  const pane = $derived(panes[Math.min(focused, panes.length - 1)]);

  // ---- another project beside (ADR 0037) ----

  /**
   * Another project, open in the second pane beside the one of the view,
   * with its own sharing, so that one that is shared stays in touch. The
   * panels at the side, the preview, the history, the review and the
   * comments are of the project of the view, and say nothing of it.
   */
  interface Guest {
    id: string;
    info: ProjectInfo;
    project: Project;
    sharing: ProjectSharing;
    folding: Folding;
  }
  let guest = $state.raw<Guest | null>(null);
  /** The project being opened beside, until it is open. */
  let guestOpening: string | null = null;
  /** The view has gone: a project opened beside after that is let go at once. */
  let gone = false;

  /** The project a pane shows; none while the one beside is being opened. */
  function projectOf(p: Pane | undefined): Project | null {
    if (!p) return null;
    if (!p.project) return project;
    return guest?.id === p.project ? guest.project : null;
  }

  /** Whether the two panes show two projects. */
  const across = $derived(panes.length > 1 && !!panes[1].project);

  /**
   * The pane of the project of the view that the panels follow: the one
   * that has the focus, or the first where the focus is on another project.
   */
  const ownIndex = $derived(pane && !pane.project ? Math.min(focused, panes.length - 1) : 0);
  const ownPane = $derived(panes[ownIndex]);
  /**
   * The pane the preview follows: the one that has the focus, where it
   * shows the project beside; else the pane of the project of the view.
   */
  const previewIndex = $derived(
    pane?.project && projectOf(pane) ? Math.min(focused, panes.length - 1) : ownIndex,
  );
  const previewPane = $derived(panes[previewIndex]);
  const previewOf = $derived(projectOf(previewPane));
  const previewId = $derived(previewPane?.project ?? projectId);

  /** The project of the pane that has the focus: what the keys, the undo and the dialogs act on. */
  const focusedProject = $derived(projectOf(pane) ?? project);

  /** How a project is named first in the bar of its pane, where two are side by side. */
  function namedIn(p: Pane): { name: string; sharing: { owner: boolean } | null } | null {
    if (!across) return null;
    const of = p.project ? guest : null;
    const name = (of ? of.project.name || of.info.name : project?.name) ?? '';
    const sharing = of ? of.sharing.sharing : shared?.sharing;
    return { name, sharing: sharing ? { owner: sharing.owner } : null };
  }

  /** The key of the camera of a pane: elements of two projects may have the same id. */
  const cameraOf = (p: Pane) => (p.project ? `${p.project}:${p.at}` : p.at);

  // The project beside follows what the second pane asks for: opened, or let go.
  const wantedGuest = $derived(panes[1]?.project ?? null);
  $effect(() => {
    const id = wantedGuest;
    untrack(() => void turnGuest(id));
  });

  async function turnGuest(id: string | null) {
    if (guest?.id === id || (id && guestOpening === id)) return;
    const was = guest;
    guest = null;
    if (was) letGo(was);
    guestOpening = id;
    if (!id) return;
    try {
      // What was written in it when it was last let go is on disk first.
      await projects.closed(id);
      if (gone || guestOpening !== id) return;
      // It is opened beside: not the project last opened.
      const last = projects.lastOpened;
      const opened = await openProject(id);
      projects.lastOpened = last;
      const p = opened.project;
      const g: Guest = {
        id,
        info: opened.info,
        project: p,
        sharing: new ProjectSharing(id, p, opened.info),
        folding: new Folding([], (e) => {
          const node = p.nodes.get(e);
          return !!node && (!node.empty || !!node.include);
        }),
      };
      if (gone || guestOpening !== id) {
        letGo(g);
        return;
      }
      guestOpening = null;
      openHere(id, p);
      p.setMe(me());
      guest = g;
    } catch (error) {
      if (guestOpening !== id) return;
      guestOpening = null;
      notifyError(t('project-beside-failed'), error);
      if (panes[1]?.project === id) closePane(1);
    }
  }

  /** Lets go of the project beside: on disk, out of touch with the others, and closed. */
  function letGo(g: Guest): Promise<void> {
    closedHere(g.id, g.project);
    g.sharing.close();
    const done = g.project.close();
    // What reads it from disk meanwhile waits for it.
    projects.closing(g.id, done);
    return done.catch((error) => console.error(error));
  }

  /** Lets go of the project beside, where there is one, when the view goes. */
  function leaveGuest(): Promise<void> {
    gone = true;
    guestOpening = null;
    const g = guest;
    guest = null;
    return g ? letGo(g) : Promise.resolve();
  }

  /**
   * Opens a project beside, in the second pane, at an element of it or at
   * the project itself; the project of the view in an ordinary second pane.
   */
  function besideProject(id: string, at?: string) {
    if (!project || !panes.length) return;
    if (id === ownId) {
      beside(at ?? PROJECT);
      return;
    }
    const mode = guestMode(panes[1]?.mode ?? panes[0].mode);
    panes = [panes[0], { at: at ?? PROJECT, mode, project: id }];
    focused = 1;
  }

  /** Up from the project: to the map of the projects, at the folder it lies in. */
  function goHome() {
    upFromProject(projectId);
  }

  /** Elements dragged from the other pane, of another project, over a pane: where, and what a drop will do. */
  const carrying = $derived.by(() => {
    const d = drag.payload;
    if (!across || d?.kind !== 'elements' || !drag.welcome) return null;
    const from = (d.data as ElementsPayload).project;
    const i = panes.findIndex((p) => {
      const of = projectOf(p);
      return !!of && of !== from;
    });
    const to = projectOf(panes[i]);
    const r = paneEls[i]?.getBoundingClientRect();
    if (!to || !r || panes.every((p) => projectOf(p) !== from)) return null;
    if (drag.x < r.left || drag.x > r.right || drag.y < r.top || drag.y > r.bottom) return null;
    return { pane: i, name: namedIn(panes[i])?.name ?? to.name, copy: drag.copy };
  });

  /** A reference cited in a project is kept with it: in that of the view as the editor keeps it, in another here. */
  async function keepIn(p: Project | null, id: string) {
    if (p === project) {
      keep(id);
      return;
    }
    try {
      p?.putReference(recordOf(await libraryGet(id)));
    } catch {
      // Not in this user's library: the project has its own copy already.
    }
  }

  // The pane of projects, outside the view, shows the project and where one is in it.
  $effect(() => {
    viewing.project = project;
    viewing.at = ownPane?.at ?? null;
    viewing.enter = (id) => show(id);
    viewing.beside = besideProject;
  });

  /** The review of the changes of the element in view, while its panel is open (ADR 0022). */
  let review = $state<Review | null>(null);
  provideReviewing({
    get review() {
      return review;
    },
  });

  /** Opens the panel of changes beside the text, or closes it. */
  function toggleReview(open = !review) {
    if (!open || !project || !ownPane) {
      review?.close();
      review = null;
      if (sideKind === 'changes') sideKind = null;
      return;
    }
    sideKind = lastSide = 'changes';
    if (review) return;
    looking = null;
    review = new Review(project, sourceFor(project, ownId), ownPane.at);
    review.later(0);
  }

  // The changes are shown in the text. Opening the panel leaves the view as
  // it is; going to a change from it turns the pane of its element to the text.
  let broughtChange = $state(-1);
  $effect(() => {
    const r = review;
    if (!r) {
      broughtChange = -1;
      return;
    }
    const shown = r.shown;
    untrack(() => {
      if (broughtChange >= 0 && shown !== broughtChange) {
        const i = panes.findIndex((p) => p.at === r.at);
        if (i >= 0 && panes[i].mode !== 'text') panes[i] = { ...panes[i], mode: 'text' };
      }
      broughtChange = shown;
    });
  });

  /** The element the panel at the side is about: that whose changes are reviewed, else the one in view. */
  const sideElement = $derived(
    sideKind === 'history'
      ? undefined
      : sideKind === 'look'
        ? (previewOf ?? project)?.node(previewPane?.at)
        : project?.node((sideKind === 'changes' && review?.at) || ownPane?.at),
  );

  // The review follows the element in view, and what is written.
  $effect(() => {
    const at = ownPane?.at;
    if (at) untrack(() => review?.turnTo(at));
  });

  // The view is made anew for every project, so the id is the same throughout;
  // it is kept here because it is needed after the view has gone.
  // svelte-ignore state_referenced_locally
  const ownId = projectId;

  onMount(async () => {
    library.load();
    try {
      // What was written in it when it was last let go, beside another, is on disk first.
      await projects.closed(ownId);
      // svelte-ignore state_referenced_locally
      const opened = await openProject(projectId);
      stored = (opened.info.view ?? {}) as StoredView;
      const p = opened.project;
      folding = new Folding(Array.isArray(stored.folded) ? stored.folded : [], (id) => {
        const node = p.nodes.get(id);
        return !!node && (!node.empty || !!node.include);
      });
      // A project that was joined and has not been fetched has no element of its own yet.
      if (p.node(PROJECT)) arrange(p);
      // What was found through everything in what is written about a work is shown with the references.
      if (jumpFor(ownId)?.references) side('references', true);
      // The library asked where a work is cited in this project.
      citationsOf = takeCitations(ownId);
      if (citationsOf) side('references', true);
      shared = new ProjectSharing(ownId, p, opened.info);
      pictures.open(ownId, () => p.usedPictures());
      void pictures.nameFrom(p.usedPictures());
      project = p;
      openHere(ownId, p);
      release = beforeClose(async () => {
        await Promise.all([leave(p), leaveGuest()]);
      });
      // The citations of a document the project was made of are gone through, where that was asked for.
      const found = takeWaiting(ownId);
      if (found && p.node(found)) goThrough(found);
    } catch (error) {
      // What is said of it is looked up when it is shown, in the language of that moment.
      failure = describeError(error) ?? '';
    }
  });

  /** Lays out the view as it was left, or as a project is first met. */
  function arrange(p: Project) {
    const route = router.route.view === 'project' ? router.route : null;
    const laid = arranged(p.nodes, stored, route);
    panes = laid.panes;
    cameras = laid.cameras;
    sideKind = laid.side;
    lastSide = laid.lastSide;
    showOutline = laid.outline;
    showPreview = laid.preview;
    sizes = laid.sizes;
  }

  // What a joined project holds has arrived.
  $effect(() => {
    if (project && !panes.length && project.node(PROJECT)) arrange(project);
  });

  // The sharing has ended from the other side.
  $effect(() => {
    const why = shared?.ended;
    if (!why || !shared) return;
    shared.ended = null;
    showShare = false;
    const fetched = !!project?.node(PROJECT);
    if (!fetched) {
      // There is nothing here to keep.
      projects.remove(ownId).catch(() => {});
      notify(
        why === 'deleted' ? t('project-unshared') : t('project-left-out'),
        t('project-unshared-unfetched'),
      );
      router.go({ view: 'projects' });
      return;
    }
    void confirm({
      title: why === 'deleted' ? t('project-unshared-this') : t('project-left-out'),
      message: why === 'deleted' ? t('project-unshared-kept') : t('project-left-out-kept'),
      confirm: t('project-understood'),
      cancel: '',
    });
  });

  // Who works here, as the history knows them: again when they are named anew.
  $effect(() => {
    const who = me();
    const p = project;
    if (!p) return;
    const g = guest?.project;
    untrack(() => {
      p.setMe(who);
      g?.setMe(who);
    });
    // For the tests of the running application, which ask the history as the review does.
    (window as unknown as Record<string, unknown>).__glaukopisHistory = {
      history: historyOf(p, ownId),
      positions,
      get review() {
        return review;
      },
    };
  });

  async function leave(p: Project) {
    historyOf(p, ownId).stop();
    shared?.close();
    await saveView();
    await p.close();
  }

  // The window is named after the project while it is open.
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
  // they are based on (`passageKindsCss`), anew whenever they change.
  $effect(() => {
    // Those of a project beside as well: their ids are their own.
    const css = project
      ? passageKindsCss([...project.passageKinds, ...(guest?.project.passageKinds ?? [])])
      : '';
    let sheet = document.getElementById('passage-kinds');
    if (!sheet) {
      sheet = document.createElement('style');
      sheet.id = 'passage-kinds';
      document.head.appendChild(sheet);
    }
    sheet.textContent = css;
  });

  /**
   * A template of the writer's own saved anew: where the project carries a
   * copy of it, or an element has chosen it, the copy is made afresh (ADR
   * 0038).
   */
  function templateSaved(id: string) {
    if (!project || !documents.templateSummary(id)?.own) return;
    if (!project.templateCopy(id) && !project.usesTemplate(id)) return;
    const p = project;
    documents
      .templateOf(id)
      .then((tp) => p.keepTemplate($state.snapshot(tp) as Template))
      .catch(() => {});
  }

  onDestroy(() => {
    document.title = 'Glaukopis';
    void getCurrentWindow()
      .setTitle('Glaukopis')
      .catch(() => {});
    document.getElementById('passage-kinds')?.remove();
    documentSettingsUi.close();
    templateEditorUi.close();
    ownKindsUi.editing = null;
    review?.close();
    comparing.copy = null;
    release?.();
    if (viewing.project === project) {
      viewing.project = null;
      viewing.at = null;
      viewing.enter = null;
      viewing.beside = null;
    }
    if (project) closedHere(ownId, project);
    void leaveGuest();
    if (pictures.project === ownId) pictures.open(null);
    // What reads the project from disk meanwhile, as the search through everything, waits for it.
    if (project)
      projects.closing(
        ownId,
        leave(project).then(() => projects.load()),
      );
  });

  // The pictures of a project that is shared are with the others as well:
  // when the connection is there, what either side lacks is sent and fetched.
  $effect(() => {
    if (!project) return;
    pictures.shared = !!shared?.sharing;
    // Again whenever the project uses a picture it did not use before.
    const used = project
      .usedPictures()
      .map((p) => p.hash)
      .sort()
      .join(' ');
    if (shared?.sharing && shared.connection?.synced && used !== undefined)
      untrack(() => void pictures.sync());
  });

  function viewToStore(): StoredView {
    const layout = {
      panes: $state.snapshot(panes),
      cameras: $state.snapshot(cameras),
      side: sideKind,
      lastSide,
      outline: showOutline,
      preview: showPreview,
      sizes: $state.snapshot(sizes),
    };
    return toStore(
      layout,
      project?.nodes ?? new Map(),
      folding.kept((id) => !!project?.node(id)),
    );
  }

  let viewTimer: ReturnType<typeof setTimeout> | undefined;
  async function saveView() {
    clearTimeout(viewTimer);
    if (!project) return;
    try {
      await projectSaveView(ownId, viewToStore());
    } catch (error) {
      console.error(error);
    }
  }

  $effect(() => {
    if (!project) return;
    void panes.map((p) => `${p.at}${p.mode}`);
    void sideKind;
    void lastSide;
    void showOutline;
    void showPreview;
    void cameras;
    void sizes.split;
    void sizes.preview;
    void sizes.references;
    void folding.folded.size;
    void [...folding.folded];
    clearTimeout(viewTimer);
    viewTimer = setTimeout(saveView, 1500);
  });

  // The place in the application follows the first pane.
  $effect(() => {
    if (!project || !panes.length) return;
    router.replace({ view: 'project', project: projectId, at: panes[0].at, mode: panes[0].mode });
  });

  // An element that is gone, deleted or taken back by undo, cannot be in
  // view: the pane turns to the nearest element over it that is there, else
  // to the project. The way to each element in view is remembered for that,
  // since a gone element no longer says where it stood.
  const ways = new Map<string, string[]>();
  $effect(() => {
    if (!project) return;
    void project.structure;
    void guest?.project.structure;
    const next = panes.map((pane) => {
      const p = projectOf(pane);
      // A project beside that is being opened, or has not been fetched, is looked at when it is there.
      if (!p || !p.node(PROJECT)) return pane;
      const key = cameraOf(pane);
      if (p.node(pane.at)) {
        ways.set(key, p.pathTo(pane.at));
        return pane;
      }
      const way = ways.get(key) ?? [];
      const at = [...way].reverse().find((id) => p.node(id)) ?? PROJECT;
      return { ...pane, at };
    });
    if (next.some((pane, i) => pane !== panes[i])) panes = next;
  });

  /** Enters an element: makes it the element in view of a pane; with an element within it, that one is shown. */
  function show(at: string, options: { pane?: number; element?: string; mode?: MapMode } = {}) {
    // Unless a pane is named, the one of the project of the view.
    const i = options.pane ?? ownIndex;
    if (!panes[i]) return;
    // Set anew, so that an element asked for again is shown again.
    reveal = null;
    reveal = options.element ?? null;
    panes[i] = { ...panes[i], at, ...(options.mode ? { mode: options.mode } : {}) };
    focused = i;
  }

  /**
   * The element in view a pane has to be at to show an element: its own
   * when the element is within it, else the tree under the project that
   * holds the element, or the project for the project itself.
   */
  function holding(element: string, i = ownIndex): string {
    const p = panes[i];
    const of = projectOf(p);
    if (!of || !p) return PROJECT;
    if (of.tree(p.at).depth.has(element)) return p.at;
    return of.pathTo(element)[1] ?? PROJECT;
  }

  /** Goes to an element from a panel: in the pane as it is, where the element is within view, else entering the tree that holds it. */
  function goTo(element: string, options: { pane?: number; mode?: MapMode } = {}) {
    const i = options.pane ?? ownIndex;
    show(holding(element, i), { ...options, pane: i, element });
  }

  /**
   * Goes up in a pane, the one that has the focus unless one is named: enters the parent of the
   * element in view, with the element one came from shown; from the
   * project itself, in the first pane, to all the projects.
   */
  function up(i = Math.min(focused, panes.length - 1)) {
    const p = panes[i];
    const of = projectOf(p);
    if (!of || !p) return;
    const parent = of.tree().parent.get(p.at);
    if (parent) show(parent, { pane: i, element: p.at });
    else if (i === 0 && p.at === PROJECT) goHome();
  }

  /**
   * Alt+Shift+Up goes up from anywhere in the view, the text of the map as
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
    event.preventDefault();
    up();
  }

  /** Shows an element in the other pane, beside the one in view; opens the other pane for it where there is none. */
  function beside(at: string) {
    if (panes.length > 1) {
      // Where the other pane shows another project, it turns to this one.
      panes[1] = panes[1].project ? { at, mode: panes[1].mode } : { ...panes[1], at };
    } else {
      panes = [panes[0], { at, mode: panes[0].mode }];
    }
    focused = 1;
  }

  /** Two side by side: the element in view as diagram and as text, until another is chosen for a side. */
  function sideBySide() {
    if (panes.length > 1) {
      // The project of the view stays in the first pane: one beside it goes.
      closePane(across ? 1 : 1 - focused);
      return;
    }
    const one = panes[0];
    panes = [one, { at: one.at, mode: one.mode === 'diagram' ? 'text' : 'diagram' }];
    focused = 0;
  }

  // ---- the room each part has ----

  function moveSplit(dx: number) {
    const width = work?.querySelector<HTMLElement>('.panes')?.offsetWidth ?? 0;
    if (width) sizes.split = clamp(sizes.split + dx / width, 0.2, 0.8);
  }

  /** The panels at the side are measured when the dragging begins: until then they have what they are given. */
  function measure(which: 'preview' | 'references') {
    const el = which === 'preview' ? previewEl : referencesEl;
    if (el && !sizes[which]) sizes[which] = el.offsetWidth;
  }

  function moveSide(which: 'preview' | 'references', dx: number) {
    sizes[which] = sideWidth(which, sizes[which], dx, work?.offsetWidth ?? 1200);
  }

  /**
   * Shows one of what the panel at the side can show, or closes it: the
   * references, the pictures, the history and the changes have the same
   * place, one at a time.
   */
  /**
   * Begins a comment: on the passage that is selected in the text, or on
   * the element the cursor is in; or on the element selected in the diagram.
   */
  function beginComment() {
    // The comments are of the project of the view.
    if (pane?.project) return;
    const view = editorUi.selection?.view;
    const element = view ? hooksOf.get(view)?.element : undefined;
    if (view && element && view.hasFocus()) {
      commentsUi.begin(element, selectedPassage(view));
      return;
    }
    const chosen = diagrams[focused]?.chosen() ?? [];
    if (chosen.length === 1) commentsUi.begin(chosen[0]);
  }

  // What the comments ask of the view: that their panel open.
  $effect(() => {
    if (!commentsUi.asked) return;
    untrack(() => {
      // A thread of a project beside, begun or asked for, is not for the panel of this one.
      if (pane?.project) {
        commentsUi.done();
        notify(t('project-beside-no-comments'));
        return;
      }
      side('comments', true);
    });
  });

  // What the citations that were found ask of the view: that their panel
  // open, with their element in view. What was asked before this view was made is not for it.
  let foundHandled = untrack(() => foundUi.asked);
  $effect(() => {
    const n = foundUi.asked;
    const p = project;
    if (!p || !ownPane) return;
    untrack(() => {
      if (n === foundHandled) return;
      foundHandled = n;
      const asked = foundUi.request;
      if (!asked || !p.node(asked.at)) return;
      const at = holding(asked.at);
      if (ownPane.at !== at) show(at);
      side('found', true);
    });
  });

  /** How many citations that were found the element in view has left, for the tab of their panel. */
  const foundCount = $derived.by(() => {
    if (!project || !ownPane) return 0;
    void project.revision;
    return countFound(project, ownPane.at);
  });

  /** Shows a citation that was found where a pane shows the element in view as text: scrolled to, and selected. */
  function showFound(at: string, entry: Entry) {
    panes.forEach((p, i) => {
      if (p.project || p.at !== at || p.mode !== 'text') return;
      const surface = texts[i]?.searchSurface();
      if (surface) void revealFound(surface, entry.target, entry.element);
    });
  }

  /** Whether an element has anything to show as a timeline: one within it that says when it is, or settings. */
  function timed(at: string, p: Pane | undefined = undefined): boolean {
    // A project beside shows its diagram or its text.
    if (!project || p?.project) return false;
    const settings = project.node(at)?.timeline;
    if (settings && (settings.axis || settings.lanes?.length)) return true;
    for (const id of project.tree(at).sequence) if (project.node(id)?.when) return true;
    return false;
  }

  function side(which: SideKind, shown?: boolean) {
    const open = shown ?? sideKind !== which;
    if (which === 'changes') {
      toggleReview(open);
      return;
    }
    if (open) {
      if (review) toggleReview(false);
      sideKind = lastSide = which;
    } else if (sideKind === which) {
      sideKind = null;
    }
    if (sideKind !== 'history') looking = null;
  }

  function closeSide() {
    if (sideKind) side(sideKind, false);
  }

  // The look of the document is asked for from elsewhere: the preview, the kind menu, the palette.
  let lookAsked = untrack(() => lookUi.asked);
  $effect(() => {
    const asked = lookUi.asked;
    if (asked === lookAsked) return;
    lookAsked = asked;
    untrack(() => side('look', true));
  });

  // The pictures are asked for from elsewhere, as from the tools for writing.
  $effect(() => {
    const wanted = picturesUi.wanted;
    if (!wanted) return;
    untrack(() => {
      picturesUi.wanted = null;
      pictureScope = wanted.scope;
      side('pictures', true);
    });
  });

  function closePane(i: number) {
    // The first pane is of the project of the view: where the other shows another, that one goes.
    const going = i === 0 && panes[1]?.project ? 1 : i;
    panes = panes.filter((_, j) => j !== going);
    focused = 0;
  }

  function keep(id: string) {
    host?.keep(id);
  }

  /** Documents are brought in one after another, each a branch under the element in view; the last that was made is shown in the text. */
  async function documentsIn(paths: (string | null)[]) {
    for (const path of paths) {
      if (!path || !project || !ownPane) continue;
      const brought = await bringIn(path, project, ownPane.at);
      if (brought) goTo(brought.top, { mode: 'text' });
      if (brought?.goThrough) goThrough(brought.top);
    }
  }

  /** When the user turns to something else, what is there is put in order on disk. */
  function onblur() {
    if (project) void project.snapshot();
    void saveView();
  }

  /** The text of the element in view is searched; from the diagram, the text is turned to first. */
  function findInText(replacing: boolean) {
    const i = focused;
    if (pane && pane.mode !== 'text') panes[i] = { ...pane, mode: 'text' };
    tick().then(() => texts[i]?.find(replacing));
  }

  // The keys of a project, while it is open: see `shell/keys`.
  onMount(() => {
    const reviewing = () => !!review;
    return shortcuts.bind({
      'diagram-or-text': {
        run: () => {
          if (pane)
            panes[focused] = { ...pane, mode: pane.mode === 'diagram' ? 'text' : 'diagram' };
        },
        when: () => !!pane,
      },
      preview: () => (showPreview = !showPreview),
      'document-settings': {
        run: () => {
          if (pane && focusedProject)
            documentSettingsUi.open({ project: focusedProject, at: pane.at });
        },
        when: () => !!pane && !!focusedProject,
      },
      'projects-pane': toggleProjectsPane,
      'side-look': () => side('look'),
      'look-type': () => lookUi.open({ section: 'type' }),
      'side-references': () => side('references'),
      // Not Ctrl+Shift+I, which the window keeps for itself while the application is being developed.
      'side-pictures': () => side('pictures'),
      'side-comments': () => side('comments'),
      'side-found': () => side('found'),
      comment: { run: beginComment, when: () => !!project },
      'side-history': () => side('history'),
      'side-changes': () => toggleReview(),
      'side-panel': () => (sideKind ? closeSide() : side(lastSide, true)),
      'side-by-side': sideBySide,
      share: () => (showShare = true),
      'text-outline': {
        run: () => (showOutline = !showOutline),
        when: () => !!pane,
      },
      find: { run: () => findInText(false), when: () => !!pane },
      replace: { run: () => findInText(true), when: () => !!pane },
      // The keys act in the project of the pane that has the focus.
      undo: { run: () => focusedProject?.undo(), when: () => !!project },
      redo: { run: () => focusedProject?.redo(), when: () => !!project },
      'redo-y': { run: () => focusedProject?.redo(), when: () => !!project },
      'review-next': { run: () => review?.next(), when: reviewing },
      'review-previous': { run: () => review?.previous(), when: reviewing },
      'review-accept': { run: () => void review?.accept(), when: reviewing },
      'review-reject': { run: () => void review?.reject(), when: reviewing },
    });
  });
</script>

<!-- Alt+Shift+Up is a key of the whole window, like those of `shell/keys`, which cannot hold an arrow. -->
<svelte:window {onblur} {onkeydown} />

{#if failure !== null}
  <EmptyState
    icon={CircleAlert}
    title={t('project-open-failed')}
    text={failure || t('project-open-failed-detail')}
  >
    <Button onclick={() => router.go({ view: 'projects' })}>{t('project-back')}</Button>
  </EmptyState>
{:else if project && !pane && shared?.shared}
  <EmptyState
    icon={CloudDownload}
    title={t('project-fetching')}
    text={shared.connection?.status === 'offline'
      ? t('project-fetching-offline')
      : t('project-fetching-on-the-way')}
  >
    <Button onclick={() => router.go({ view: 'projects' })}>{t('project-back')}</Button>
  </EmptyState>
{:else if !project || !pane}
  <div class="centre"><Spinner size={22} /></div>
{:else}
  <div class="project">
    <header>
      <IconButton label={t('project-all-projects')} onclick={() => router.go({ view: 'projects' })}>
        <ArrowLeft size={16} />
      </IconButton>

      <span class="divider"></span>

      <Segmented
        value={pane.mode}
        label={t('project-view')}
        options={[
          { value: 'diagram', label: t('project-diagram'), icon: Network },
          { value: 'text', label: t('project-text'), icon: FileText },
          ...(timed(pane.at, pane) || pane.mode === 'timeline'
            ? [{ value: 'timeline' as const, label: t('timeline-title'), icon: Clock }]
            : []),
        ]}
        onchange={(mode) => (panes[focused] = { ...pane, mode })}
      />
      <button
        type="button"
        class="tool"
        class:on={panes.length > 1}
        aria-pressed={panes.length > 1}
        aria-label={panes.length > 1 ? t('project-one-at-a-time') : t('project-side-by-side')}
        use:tooltip={{
          text: panes.length > 1 ? t('project-one-at-a-time') : t('project-side-by-side'),
          side: 'bottom',
        }}
        onclick={sideBySide}
      >
        <Columns2 size={15} />
        <span>{t('project-side-by-side-short')}</span>
      </button>
      <button
        type="button"
        class="tool"
        class:on={showPreview}
        aria-pressed={showPreview}
        aria-label={t('project-preview')}
        use:tooltip={{ text: t('project-preview'), shortcut: 'Ctrl+P', side: 'bottom' }}
        onclick={() => (showPreview = !showPreview)}
      >
        <BookOpenText size={15} />
        <span>{t('project-preview-short')}</span>
      </button>
      <span
        class="share"
        class:shared={shared?.shared}
        data-status={shared?.connection?.tooLarge
          ? 'refused'
          : (shared?.connection?.status ?? 'none')}
      >
        <button
          type="button"
          class="tool"
          class:on={showShare}
          aria-label={!shared?.shared
            ? t('project-share')
            : shared.connection?.tooLarge
              ? t('project-shared-too-large')
              : shared.connection?.status === 'connected'
                ? t('project-shared')
                : t('project-shared-offline')}
          use:tooltip={{
            text: !shared?.shared
              ? t('project-share')
              : shared.connection?.tooLarge
                ? t('project-shared-too-large')
                : shared.connection?.status === 'connected'
                  ? t('project-shared')
                  : t('project-shared-offline'),
            side: 'bottom',
          }}
          onclick={() => (showShare = true)}
        >
          <Users size={15} />
          <span>{shared?.shared ? t('project-shared') : t('project-share')}</span>
        </button>
      </span>
      {#if shared?.connection}
        <Presence people={project.others} />
      {/if}

      <div class="status" aria-live="polite">
        {#if project.status === 'error'}
          <span class="failed" use:tooltip={project.saveError ?? ''}>
            <CircleAlert size={14} />
            {t('project-not-saved')}
          </span>
        {/if}
      </div>

      <!-- In the project of the pane that has the focus, as the keys. -->
      <IconButton
        label={t('common-undo')}
        shortcut="Ctrl+Z"
        disabled={!focusedProject?.canUndo}
        onclick={() => focusedProject?.undo()}
      >
        <Undo2 size={16} />
      </IconButton>
      <IconButton
        label={t('project-redo')}
        shortcut="Ctrl+Shift+Z"
        disabled={!focusedProject?.canRedo}
        onclick={() => focusedProject?.redo()}
      >
        <Redo2 size={16} />
      </IconButton>
      <IconButton
        label={t('project-side')}
        active={!!sideKind}
        onclick={() => (sideKind ? closeSide() : side(lastSide, true))}
      >
        <PanelRight size={16} />
      </IconButton>
    </header>

    {#if project}
      <WordsBar {project} />
    {/if}

    <div
      class="work"
      bind:this={work}
      use:dropTarget={{
        accepts: ['files'],
        ondrop: (e) => filesDropped(e, { project, documentsIn, keep }),
      }}
    >
      <div class="panes" class:two={panes.length > 1} class:across>
        {#each panes as p, i (i)}
          {@const of = projectOf(p)}
          {#if i === 1}
            <Divider
              label={t('project-between-maps')}
              onmove={moveSplit}
              onreset={() => (sizes.split = GIVEN.split)}
            />
          {/if}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="pane"
            bind:this={paneEls[i]}
            style:flex-grow={panes.length > 1 ? (i === 0 ? sizes.split : 1 - sizes.split) : 1}
            class:focused={panes.length > 1 && i === focused}
            onpointerdowncapture={() => (focused = i)}
            onfocusin={() => (focused = i)}
          >
            <div
              class="pane-bar"
              use:dropTarget={{
                accepts: (d) =>
                  !p.project && d.kind === 'files' && (d.data as string[]).some(mapOfIt),
                ondrop: (e) => documentsIn((e.payload.data as string[]).filter(mapOfIt)),
              }}
            >
              <!-- The pane of projects is one for the project: its button is in the first bar, nearest it. -->
              {#if i === 0}
                <IconButton
                  label={t('home-pane-toggle')}
                  shortcut="Ctrl+Shift+L"
                  size="sm"
                  active={settings.value.projectsPane}
                  data-projects-button
                  onclick={toggleProjectsPane}
                >
                  <PanelLeft size={15} />
                </IconButton>
              {/if}
              <IconButton
                label={t('text-outline')}
                shortcut="Ctrl+Shift+O"
                size="sm"
                active={showOutline}
                onclick={() => (showOutline = !showOutline)}
              >
                <ListTree size={15} />
              </IconButton>
              {#if of}
                <MapBar
                  project={of}
                  at={p.at}
                  beside={panes.length > 1 && !across ? panes[1 - i]?.at : null}
                  onselect={(id, mode) => show(id, { pane: i, mode })}
                  onbeside={p.project ? (id) => show(id, { pane: i }) : beside}
                  ondocument={p.project
                    ? undefined
                    : async () => documentsIn([await chooseDocument()])}
                  named={namedIn(p)}
                  home={i === 0}
                  onhome={goHome}
                />
              {/if}
              {#if p.mode === 'text' && of}
                <span class="bar-divider"></span>
                <div class="writing">
                  <WritingTools
                    project={of}
                    scope={paneEls[i]}
                    at={p.at}
                    onelement={(what) => texts[i]?.newElement(what)}
                  />
                </div>
              {/if}
              <span class="spring"></span>
              {#if panes.length > 1}
                <Segmented
                  value={p.mode}
                  label={t('project-view-this')}
                  size="sm"
                  options={[
                    {
                      value: 'diagram',
                      label: t('project-diagram'),
                      icon: Network,
                      iconOnly: true,
                    },
                    { value: 'text', label: t('project-text'), icon: FileText, iconOnly: true },
                    ...(timed(p.at, p) || p.mode === 'timeline'
                      ? [
                          {
                            value: 'timeline' as const,
                            label: t('timeline-title'),
                            icon: Clock,
                            iconOnly: true,
                          },
                        ]
                      : []),
                  ]}
                  onchange={(mode) => (panes[i] = { ...p, mode })}
                />
                <!-- The first pane stays where the second shows another project. -->
                {#if !(across && i === 0)}
                  <IconButton
                    label={t('project-close-side')}
                    size="sm"
                    onclick={() => closePane(i)}
                  >
                    <X size={14} />
                  </IconButton>
                {/if}
              {/if}
            </div>
            <div class="pane-body">
              {#if !of || !of.node(PROJECT)}
                <!-- A project beside, being opened, or on its way from the others. -->
                <div class="centre"><Spinner size={20} /></div>
              {:else}
                {@const paneFolding = (p.project ? guest?.folding : null) ?? folding}
                {#if showOutline}
                  <Outline
                    project={of}
                    at={p.at}
                    items={outlineItems(of, p.at, paneFolding)}
                    current={p.mode === 'text' ? (tops[i] ?? null) : null}
                    ongo={(id) =>
                      p.mode === 'text' && texts[i] ? texts[i].goTo(id) : goTo(id, { pane: i })}
                    onclose={() => (showOutline = false)}
                    width={outlineWidth}
                  />
                  <Divider
                    label={t('text-outline-between')}
                    onmove={(dx) =>
                      (outlineWidth = Math.max(160, Math.min(520, outlineWidth + dx)))}
                    onreset={() => (outlineWidth = OUTLINE_WIDTH)}
                  />
                {/if}
                <div class="view">
                  {#key `${p.project ?? ''}:${p.at}:${p.mode}`}
                    {#if looking && looking.pane === i && !p.project}
                      <PastView {project} at={p.at} {looking} onback={() => (looking = null)} />
                    {:else if p.mode === 'timeline' && !p.project}
                      <TimelineView
                        {project}
                        at={p.at}
                        ongo={(element) => goTo(element, { pane: i, mode: 'text' })}
                        reveal={i === focused ? reveal : null}
                      />
                    {:else if p.mode === 'diagram' || p.mode === 'timeline'}
                      <MapDiagram
                        bind:this={diagrams[i]}
                        project={of}
                        at={p.at}
                        camera={cameras[cameraOf(p)] ?? null}
                        oncamera={(c) => (cameras[cameraOf(p)] = c)}
                        onkeep={(id) => keepIn(of, id)}
                        onenter={(id) => show(id, { pane: i })}
                        onleave={of.tree().parent.get(p.at) ? () => up(i) : undefined}
                        reveal={i === focused ? reveal : null}
                        besideProject={across ? projectOf(panes[1 - i]) : null}
                      />
                    {:else}
                      <MapText
                        bind:this={texts[i]}
                        project={of}
                        at={p.at}
                        onkeep={(id) => keepIn(of, id)}
                        onenter={(id) => show(id, { pane: i })}
                        onleave={of.tree().parent.get(p.at) ? () => up(i) : undefined}
                        reveal={i === focused ? reveal : null}
                        focused={i === focused}
                        folding={paneFolding}
                        outline={showOutline}
                        ontop={(id) => (tops[i] = id)}
                        besideProject={across ? projectOf(panes[1 - i]) : null}
                      />
                    {/if}
                  {/key}
                  {#if carrying?.pane === i}
                    <!-- What a drop of elements from the other project will do, before it is done. -->
                    <div class="carrying" role="status">
                      {carrying.copy
                        ? t('project-copy-to-project', { name: carrying.name })
                        : t('project-move-to-project', { name: carrying.name })}
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      {#if showPreview}
        <Divider
          label={t('project-between-preview')}
          onstart={() => measure('preview')}
          onmove={(dx) => moveSide('preview', dx)}
          onreset={() => (sizes.preview = 0)}
        />
        <div
          class="side wide"
          bind:this={previewEl}
          style:width={sizes.preview ? `${sizes.preview}px` : undefined}
        >
          <!-- Of the project of the pane it follows: made anew when that is another. -->
          {#key previewId}
            <PreviewPanel
              project={previewOf ?? project}
              projectId={previewId}
              at={previewPane.at}
              onclose={() => (showPreview = false)}
              ongo={(element) => {
                // In the text of this element where it is shown; else the pane it follows turns to the text.
                const i = panes.findIndex(
                  (p) =>
                    p.project === previewPane.project &&
                    p.at === previewPane.at &&
                    p.mode === 'text',
                );
                goTo(element, { mode: 'text', pane: i >= 0 ? i : previewIndex });
              }}
              current={() => {
                const i =
                  previewPane.mode === 'text'
                    ? previewIndex
                    : panes.findIndex(
                        (p) =>
                          p.project === previewPane.project &&
                          p.at === previewPane.at &&
                          p.mode === 'text',
                      );
                return texts[i]?.currentElement() ?? null;
              }}
            />
          {/key}
        </div>
      {/if}
      {#if sideKind}
        {#snippet tabs()}
          <SideTabs
            current={sideKind ?? lastSide}
            counts={{ found: foundCount }}
            onpick={(kind) => side(kind, true)}
          />
        {/snippet}
        <Divider
          label={sideKind === 'look'
            ? t('look-between')
            : sideKind === 'pictures'
              ? t('project-between-pictures')
              : sideKind === 'history'
                ? t('history-between')
                : sideKind === 'comments'
                  ? t('comments-between')
                  : sideKind === 'found'
                    ? t('found-between')
                    : t('project-between-references')}
          onstart={() => measure('references')}
          onmove={(dx) => moveSide('references', dx)}
          onreset={() => (sizes.references = 0)}
        />
        <div
          class="side"
          bind:this={referencesEl}
          style:width={sizes.references ? `${sizes.references}px` : undefined}
        >
          {#if sideElement}
            <div class="side-map" class:split={panes.length > 1}>
              <span class="overline">{t('project-side-map')}</span>
              <strong>{sideElement.title || t('project-untitled')}</strong>
            </div>
          {/if}
          {#if sideKind === 'look'}
            <!-- The look of the document the preview shows. -->
            {@const lookOf = previewOf ?? project}
            {#key `${previewId}\n${previewPane.at}`}
              <LookPanel
                project={lookOf}
                at={previewPane.at}
                passageKinds={lookOf.passageKinds}
                previewing={showPreview}
                onpreview={() => (showPreview = true)}
                head={tabs}
                onclose={closeSide}
              />
            {/key}
          {:else if sideKind === 'changes' && review}
            <ReviewPanel {review} head={tabs} onclose={closeSide} />
          {:else if sideKind === 'history'}
            <HistoryPanel
              {project}
              history={historyOf(project, ownId)}
              {looking}
              pane={ownIndex}
              onlook={(l) => (looking = l)}
              head={tabs}
              onclose={closeSide}
            />
          {:else if sideKind === 'comments'}
            <CommentsPanel
              {project}
              at={ownPane.at}
              head={tabs}
              onclose={closeSide}
              ongo={(element) => goTo(element)}
              onopen={(element) => {
                // In the diagram, where the element is within view, its box opens; else the text is gone to.
                if (ownPane.mode === 'diagram' && holding(element) === ownPane.at)
                  diagrams[ownIndex]?.write(element);
                else goTo(element, { mode: 'text' });
              }}
            />
          {:else if sideKind === 'found'}
            {#key ownPane.at}
              <FoundPanel
                {project}
                at={ownPane.at}
                head={tabs}
                onclose={closeSide}
                onkeep={keep}
                onshow={(entry) => showFound(ownPane.at, entry)}
              />
            {/key}
          {:else if sideKind === 'pictures'}
            <PicturePanel
              {project}
              at={ownPane.at}
              bind:scope={pictureScope}
              head={tabs}
              onclose={closeSide}
              onenter={(id) => show(id)}
            />
          {:else}
            <ReferencePanel
              {project}
              at={ownPane.at}
              head={tabs}
              onclose={closeSide}
              show={citationsOf}
              ongo={(element) => goTo(element)}
            />
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <EditorHost bind:this={host} {project} />
  <DocumentHost />
{/if}

<!-- What is asked from the menu of an element is done in the project of the pane that has the focus. -->
{#if comparing.copy && focusedProject}
  <CopyDialog
    project={focusedProject}
    id={comparing.copy}
    onclose={() => (comparing.copy = null)}
    ongo={(element) => goTo(element, { pane: Math.min(focused, panes.length - 1) })}
  />
{/if}

{#if kindsUi.editing && focusedProject}
  {#key kindsUi.editing.id}
    <KindDialog
      project={focusedProject}
      id={kindsUi.editing.id}
      assign={kindsUi.editing.assign}
      onclose={() => (kindsUi.editing = null)}
    />
  {/key}
{/if}

{#if ownKindsUi.editing && focusedProject}
  {#key ownKindsUi.editing.id}
    <PassageKindDialog
      project={focusedProject}
      id={ownKindsUi.editing.id}
      family={ownKindsUi.editing.family}
      apply={ownKindsUi.editing.apply}
      onclose={() => (ownKindsUi.editing = null)}
    />
  {/key}
{/if}

{#if documentSettingsUi.request}
  {@const asked = documentSettingsUi.request}
  {#key asked}
    <DocumentSettingsWindow
      project={asked.project}
      at={asked.at}
      section={asked.section}
      ongo={(element) => goTo(element, { pane: Math.min(focused, panes.length - 1) })}
      onclose={() => documentSettingsUi.close()}
    />
  {/key}
{/if}

{#if templateEditorUi.request}
  {@const asked = templateEditorUi.request}
  <TemplateEditor
    id={asked.id}
    fresh={asked.fresh}
    copy={asked.copy}
    onsaved={(id) => {
      // Held before the editor goes: what it was asked for goes with it.
      const given = asked.onsaved;
      templateEditorUi.close();
      given?.(id);
      templateSaved(id);
    }}
    onclose={() => templateEditorUi.close()}
  />
{/if}

{#if whenUi.element && focusedProject}
  {#key whenUi.element}
    <WhenDialog
      project={focusedProject}
      id={whenUi.element}
      at={pane.at}
      onclose={() => (whenUi.element = null)}
    />
  {/key}
{/if}

{#if kindsUi.managing && focusedProject}
  <KindsDialog project={focusedProject} onclose={() => (kindsUi.managing = false)} />
{/if}

{#if showShare && shared && project}
  <SharePanel {shared} {projectId} projectName={project.name} onclose={() => (showShare = false)} />
{/if}

<style>
  .centre {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .project {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  header {
    display: flex;
    align-items: center;
    gap: 4px;
    height: var(--bar-h);
    flex: none;
    padding: 0 10px 0 8px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
    container-type: inline-size;
  }
  /* In a narrow window the buttons of the bar keep their pictures only; the tooltips still name them. */
  @container (max-width: 700px) {
    .tool > span,
    header :global(.segmented span) {
      display: none;
    }
  }
  .divider {
    width: 1px;
    height: 18px;
    margin: 0 6px;
    flex: none;
    background: var(--line);
  }
  .status {
    flex: none;
    font-size: var(--text-sm);
  }
  .failed {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-right: 6px;
    color: var(--danger);
    font-weight: 500;
  }
  .tool {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: none;
    height: 28px;
    padding: 0 9px;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: transparent;
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
  .share {
    position: relative;
    display: inline-flex;
    flex: none;
  }
  /* A dot that tells whether the others are within reach. */
  .share.shared::after {
    content: '';
    position: absolute;
    top: 4px;
    right: 3px;
    width: 7px;
    height: 7px;
    border: 1.5px solid var(--paper);
    border-radius: 50%;
    background: var(--ink-4);
    pointer-events: none;
  }
  .share.shared[data-status='connected']::after {
    background: var(--ok);
  }
  .share.shared[data-status='offline']::after {
    background: var(--warn);
  }
  .share.shared[data-status='refused']::after {
    background: var(--danger);
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
  .pane {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
  }
  .pane-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 4px;
    min-height: 40px;
    flex: none;
    padding: 4px 8px 4px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .pane.focused .pane-bar {
    background: var(--accent-softer);
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
  .pane-body > .view > .carrying {
    position: absolute;
    top: 10px;
    left: 50%;
    z-index: 5;
    max-width: calc(100% - 24px);
    transform: translateX(-50%);
    padding: 5px 12px;
    border-radius: 20px;
    background: var(--accent);
    color: var(--accent-ink);
    font-size: var(--text-sm);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
    box-shadow: var(--shadow-2);
  }
  .pane-bar :global([data-drop-over]) {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .bar-divider {
    width: 1px;
    height: 18px;
    margin: 0 4px;
    flex: none;
    background: var(--line);
  }
  /* The tools take the room there is before anything springs. Where there is
     too little beside the name, they go to a line of their own under it. */
  .writing {
    flex: 1000 1 0;
    min-width: min(100%, 520px);
  }
  .spring {
    flex: 1;
  }
  .pane-body {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .pane-body > .centre {
    flex: 1;
  }
  /* The view beside the outline, where that is shown. */
  .pane-body > .view {
    flex: 1;
    min-width: 0;
    min-height: 0;
    position: relative;
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
  .side-map strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .side.wide {
    width: min(46%, 640px);
  }
</style>

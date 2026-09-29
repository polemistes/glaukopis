<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import BookMarked from '@lucide/svelte/icons/book-marked';
  import BookOpenText from '@lucide/svelte/icons/book-open-text';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import CloudDownload from '@lucide/svelte/icons/cloud-download';
  import Columns2 from '@lucide/svelte/icons/columns-2';
  import FileText from '@lucide/svelte/icons/file-text';
  import Images from '@lucide/svelte/icons/images';
  import Network from '@lucide/svelte/icons/network';
  import Redo2 from '@lucide/svelte/icons/redo-2';
  import Undo2 from '@lucide/svelte/icons/undo-2';
  import Users from '@lucide/svelte/icons/users';
  import X from '@lucide/svelte/icons/x';
  import { projectSaveView } from '$lib/api/projects';
  import { Folding } from './text/folding.svelte';
  import { sharingRename } from '$lib/api/sharing';
  import Presence from '$lib/sharing/Presence.svelte';
  import SharePanel from '$lib/sharing/SharePanel.svelte';
  import { ProjectSharing } from '$lib/sharing/sharing.svelte';
  import { importDropped } from '$lib/library/references.svelte';
  import { isDocumentPath, isPlainTextPath } from '$lib/api/imported';
  import { isReadPath } from '$lib/api/ocr';
  import { bringIn, chooseDocument } from '$lib/documents/bringing.svelte';
  import DocumentHost from '$lib/documents/DocumentHost.svelte';
  import { goThrough, takeWaiting } from '$lib/found/found.svelte';
  import FoundHost from '$lib/found/FoundHost.svelte';
  import { tablesDropped } from '$lib/tables/ask';
  import { insertFigure, widthFor } from '$lib/editor/commands';
  import { viewsByDom } from '$lib/editor/ui.svelte';
  import { isPicturePath, pictures } from '$lib/figures/pictures.svelte';
  import { picturesUi, type PictureScope } from '$lib/pictures/store.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import { dropTarget, type DropEvent } from '$lib/ui/drag.svelte';
  import { notify } from '$lib/ui/toast.svelte';
  import EditorHost from '$lib/editor/EditorHost.svelte';
  import { beforeClose } from '$lib/state/closing';
  import { library } from '$lib/state/library.svelte';
  import { openProject, projects } from '$lib/state/projects.svelte';
  import { jumpFor } from '$lib/search/everything.svelte';
  import { router, type MapMode } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import Divider from '$lib/ui/Divider.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { t } from '$lib/i18n';
  import MapDiagram, { type Camera } from './diagram/MapDiagram.svelte';
  import MapTabs from './MapTabs.svelte';
  import type { Project } from './model/project.svelte';
  import PicturePanel from './PicturePanel.svelte';
  import ReferencePanel from './ReferencePanel.svelte';
  import MapText from './text/MapText.svelte';
  import PreviewPanel from '$lib/preview/PreviewPanel.svelte';
  import { historyOf } from '$lib/history/history.svelte';
  import { me } from '$lib/history/me.svelte';
  import * as positions from '$lib/history/positions';

  let { projectId }: { projectId: string } = $props();

  interface Pane {
    map: string;
    mode: MapMode;
  }

  /** How the room is shared between the parts of the view. Nought for what is given. */
  interface Sizes {
    /** The part of the width the first of two maps has. */
    split: number;
    preview: number;
    /** The panel at the side, whether it shows the references or the pictures. */
    references: number;
  }

  const GIVEN: Sizes = { split: 0.5, preview: 0, references: 0 };

  interface StoredView {
    sizes?: Partial<Sizes>;
    panes?: Pane[];
    cameras?: Record<string, Camera>;
    references?: boolean;
    /** The panel at the side shows the pictures. Not both: they have the same place. */
    pictures?: boolean;
    preview?: boolean;
    /** The elements under which the text is folded away. */
    folded?: string[];
  }

  let project = $state<Project | null>(null);
  let failure = $state<string | null>(null);
  let panes = $state<Pane[]>([]);
  let focused = $state(0);
  let cameras = $state<Record<string, Camera>>({});
  let showReferences = $state(false);
  let showPictures = $state(false);
  /** Which pictures the panel shows. */
  let pictureScope = $state<PictureScope>('project');
  let showPreview = $state(false);
  let sizes = $state<Sizes>({ ...GIVEN });
  let work = $state<HTMLDivElement>();
  let previewEl = $state<HTMLDivElement>();
  let referencesEl = $state<HTMLDivElement>();
  let renaming = $state<string | null>(null);
  let host = $state<ReturnType<typeof EditorHost>>();
  /** An element to show when a map is opened by a jump. */
  let reveal = $state<string | null>(null);
  let release: (() => void) | undefined;
  let shared = $state<ProjectSharing | null>(null);
  let showShare = $state(false);
  /** What was kept of the view, until there are maps to show. */
  let stored: StoredView = {};
  /** What is folded away in the text: as it was left, and for every map of the project. */
  let folding = $state.raw(new Folding());
  /** The texts of the maps in the panes, where a pane shows the text: to be searched. */
  let texts = $state<(ReturnType<typeof MapText> | undefined)[]>([]);

  const pane = $derived(panes[Math.min(focused, panes.length - 1)]);

  // The view is made anew for every project, so the id is the same throughout;
  // it is kept here because it is needed after the view has gone.
  // svelte-ignore state_referenced_locally
  const ownId = projectId;

  onMount(async () => {
    library.load();
    try {
      // svelte-ignore state_referenced_locally
      const opened = await openProject(projectId);
      stored = (opened.info.view ?? {}) as StoredView;
      const p = opened.project;
      folding = new Folding(Array.isArray(stored.folded) ? stored.folded : [], (id) => {
        const node = p.nodes.get(id);
        return !!node && (!node.empty || !!node.include);
      });
      // A project that was joined and has not been fetched has no maps yet.
      if (p.maps.length) arrange(p);
      // What was found through everything in what is written about a work is shown with the references.
      if (jumpFor(ownId)?.references) side('references', true);
      shared = new ProjectSharing(ownId, p, opened.info);
      pictures.open(ownId, () => p.usedPictures());
      void pictures.nameFrom(p.usedPictures());
      project = p;
      release = beforeClose(() => leave(p));
      // The citations of a document the project was made of are gone through, where that was asked for.
      const found = takeWaiting(ownId);
      if (found && p.map(found)) goThrough(found);
    } catch (error) {
      // What is said of it is looked up when it is shown, in the language of that moment.
      failure = describeError(error) ?? '';
    }
  });

  /** Lays out the view as it was left, or as a project is first met. */
  function arrange(p: Project) {
    const known = (m: string | undefined) => (m && p.map(m) ? m : undefined);
    const route = router.route.view === 'project' ? router.route : null;
    const first: Pane = {
      map: known(route?.map) ?? known(stored.panes?.[0]?.map) ?? p.maps[0].id,
      mode: route?.mode ?? stored.panes?.[0]?.mode ?? 'diagram',
    };
    const list = [first];
    const second = stored.panes?.[1];
    if (!route?.map && second && known(second.map))
      list.push({ map: second.map, mode: second.mode });
    panes = list;
    cameras = stored.cameras ?? {};
    showReferences = stored.references ?? false;
    showPictures = !showReferences && (stored.pictures ?? false);
    showPreview = stored.preview ?? false;
    sizes = { ...GIVEN, ...stored.sizes };
  }

  // What a joined project holds has arrived.
  $effect(() => {
    if (project && !panes.length && project.maps.length) arrange(project);
  });

  // The sharing has ended from the other side.
  $effect(() => {
    const why = shared?.ended;
    if (!why || !shared) return;
    shared.ended = null;
    showShare = false;
    const fetched = (project?.maps.length ?? 0) > 0;
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
    untrack(() => p.setMe(who));
    // For the tests of the running application, which ask the history as the review does.
    (window as unknown as Record<string, unknown>).__glaukopisHistory = {
      history: historyOf(p, ownId),
      positions,
    };
  });

  async function leave(p: Project) {
    historyOf(p, ownId).stop();
    shared?.close();
    await saveView();
    await p.close();
  }

  onDestroy(() => {
    release?.();
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
    // Only the cameras of maps that exist.
    const kept: Record<string, Camera> = {};
    for (const [id, c] of Object.entries(cameras)) if (project?.map(id)) kept[id] = c;
    return {
      sizes: $state.snapshot(sizes),
      panes: $state.snapshot(panes),
      cameras: kept,
      references: showReferences,
      pictures: showPictures,
      preview: showPreview,
      folded: folding.kept((id) => !!project?.node(id)),
    };
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
    void panes.map((p) => `${p.map}${p.mode}`);
    void showReferences;
    void showPictures;
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
    router.replace({ view: 'project', project: projectId, map: panes[0].map, mode: panes[0].mode });
  });

  // A map that is gone cannot be shown.
  $effect(() => {
    if (!project) return;
    const maps = project.maps;
    if (!maps.length) return;
    let changed = false;
    const next = panes.filter((p, i) => {
      if (maps.some((m) => m.id === p.map)) return true;
      changed = true;
      return i === 0;
    });
    if (next[0] && !maps.some((m) => m.id === next[0].map)) {
      next[0] = { ...next[0], map: maps[0].id };
      changed = true;
    }
    if (changed) {
      panes = next;
      focused = Math.min(focused, next.length - 1);
    }
  });

  function show(map: string, options: { pane?: number; element?: string } = {}) {
    const i = options.pane ?? focused;
    if (!panes[i]) return;
    reveal = options.element ?? null;
    panes[i] = { ...panes[i], map };
    focused = i;
  }

  function beside(map: string) {
    if (panes.length > 1) {
      panes[1] = { ...panes[1], map };
    } else {
      // The map asked for goes beside; if it is the one in view, another takes its place here.
      const other = project?.maps.find((m) => m.id !== map);
      if (panes[0].map === map && other) panes[0] = { ...panes[0], map: other.id };
      panes = [panes[0], { map, mode: panes[0].mode }];
    }
    focused = 1;
  }

  /** Two side by side: the map in view as diagram and as text, until another is chosen for a side. */
  function sideBySide() {
    if (panes.length > 1) {
      closePane(1 - focused);
      return;
    }
    const one = panes[0];
    panes = [one, { map: one.map, mode: one.mode === 'diagram' ? 'text' : 'diagram' }];
    focused = 0;
  }

  // ---- the room each part has ----

  const clamp = (value: number, least: number, most: number) =>
    Math.min(Math.max(value, least), most);

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
    const all = work?.offsetWidth ?? 1200;
    const least = which === 'preview' ? 320 : 240;
    const most = Math.max(least, which === 'preview' ? all * 0.7 : Math.min(640, all * 0.5));
    sizes[which] = clamp(sizes[which] - dx, least, most);
  }

  /** The references and the pictures have the same place at the side: one at a time. */
  function side(which: 'references' | 'pictures', shown?: boolean) {
    const open = shown ?? !(which === 'references' ? showReferences : showPictures);
    showReferences = which === 'references' && open;
    showPictures = which === 'pictures' && open;
  }

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
    panes = panes.filter((_, j) => j !== i);
    focused = 0;
  }

  function keep(id: string) {
    host?.keep(id);
  }

  function commitName() {
    if (renaming === null || !project) return;
    const name = renaming.trim();
    renaming = null;
    if (name && name !== project.name) {
      project.setName(name);
      projects.rename(projectId, name).catch(() => {});
      // Those who join later are told the name by the server.
      if (shared?.sharing?.owner) sharingRename(projectId, name).catch(() => {});
    }
  }

  /**
   * Files dropped from the desktop are taken into the library. Dropped on an
   * element, their references are cited at the end of its text.
   */
  async function filesDropped(event: DropEvent) {
    const under = document.elementFromPoint(event.x, event.y);
    const at = under?.closest<HTMLElement>('[data-node], [data-section]');
    const element = at?.dataset.node ?? at?.dataset.section ?? null;
    const all = event.payload.data as string[];
    const shown = all.filter(isPicturePath);
    const p = project;
    if (shown.length && p) {
      // Pictures become figures: where they were dropped, in a text that is
      // being written; otherwise at the end of the element they were dropped on.
      const written = under?.closest('.ProseMirror.body');
      const view = written ? viewsByDom.get(written) : undefined;
      if (!view && !(element && p.node(element))) {
        notify(t('project-drop-picture'));
      } else {
        let where = view?.posAtCoords({ left: event.x, top: event.y })?.pos;
        for (const path of shown) {
          const picture = await pictures.addFile(path);
          if (!picture) continue;
          if (view && !view.isDestroyed) {
            insertFigure(picture, where)(view.state, view.dispatch);
            where = undefined;
          } else if (element) {
            p.checkpoint();
            p.addFigure(element, picture, widthFor(picture));
            p.checkpoint();
          }
        }
      }
    }
    // Files that hold tables become tables, in the same places.
    const body = under?.closest('.ProseMirror.body');
    const text = body ? viewsByDom.get(body) : undefined;
    const rest = await tablesDropped(
      all.filter((path) => !isPicturePath(path)),
      {
        view: text,
        at: text?.posAtCoords({ left: event.x, top: event.y })?.pos,
        project: p,
        element,
      },
    );
    // Documents become maps of their own; text without marks is one when nothing else claims it.
    const written = (path: string) => isDocumentPath(path) || isPlainTextPath(path);
    if (p) await documentsIn(rest.filter(written));
    const others = rest.filter((path) => !written(path));
    if (!others.length) return;
    const outcome = await importDropped(others);
    if (!outcome?.concerned?.length || !element || !p || !p.node(element)) return;
    p.checkpoint();
    p.cite(element, outcome.concerned);
    p.checkpoint();
    for (const id of outcome.concerned) keep(id);
    const name = p.node(element)?.title;
    const count = outcome.concerned.length;
    notify(
      name ? t('project-cited-in', { count, name }) : t('project-cited-in-element', { count }),
    );
  }

  /**
   * What becomes a map when it is dropped on the tabs of the maps: a
   * document, and a PDF or a picture, whose text is read. Elsewhere a PDF is
   * taken into the library, and a picture becomes a figure.
   */
  const mapOfIt = (path: string) =>
    isDocumentPath(path) || isPlainTextPath(path) || isReadPath(path);

  /** Maps are made of documents, one after another, and the last that was made is shown as text. */
  async function documentsIn(paths: (string | null)[]) {
    for (const path of paths) {
      if (!path || !project) continue;
      const brought = await bringIn(path, project);
      if (brought && panes.length) panes[focused] = { map: brought.map, mode: 'text' };
      if (brought?.goThrough) goThrough(brought.map);
    }
  }

  /** When the user turns to something else, what is there is put in order on disk. */
  function onblur() {
    if (project) void project.snapshot();
    void saveView();
  }

  function onkeydown(event: KeyboardEvent) {
    if (!project) return;
    const mod = event.ctrlKey || event.metaKey;
    if (!mod || event.altKey) return;
    const target = event.target as HTMLElement;
    const typing = target.closest('input, textarea, .prose');
    const key = event.key.toLowerCase();
    if (key === 'd' && !event.shiftKey) {
      // Between the two views of the map.
      event.preventDefault();
      if (pane) panes[focused] = { ...pane, mode: pane.mode === 'diagram' ? 'text' : 'diagram' };
    } else if (key === 'r' && event.shiftKey) {
      event.preventDefault();
      side('references');
    } else if (key === 'p' && event.shiftKey) {
      // Not Ctrl+Shift+I, which the window keeps for itself while the application is being developed.
      event.preventDefault();
      side('pictures');
    } else if (key === 'p' && !event.shiftKey) {
      event.preventDefault();
      showPreview = !showPreview;
    } else if ((key === 'f' || key === 'h') && !event.shiftKey) {
      // The text of the map is searched; from the diagram, the text is turned to first.
      event.preventDefault();
      const i = focused;
      if (pane && pane.mode !== 'text') panes[i] = { ...pane, mode: 'text' };
      tick().then(() => texts[i]?.find(key === 'h'));
    } else if (!typing && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) project.redo();
      else project.undo();
    } else if (!typing && key === 'y') {
      event.preventDefault();
      project.redo();
    }
  }
</script>

<svelte:window {onkeydown} {onblur} />

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

      {#if renaming !== null}
        <input
          class="name editing"
          bind:value={renaming}
          aria-label={t('project-name')}
          size={Math.max(10, renaming.length + 1)}
          onblur={commitName}
          onkeydown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') commitName();
            else if (e.key === 'Escape') renaming = null;
          }}
          {@attach (el: HTMLInputElement) => el.select()}
        />
      {:else}
        <button
          type="button"
          class="name serif truncate"
          use:tooltip={t('project-rename')}
          onclick={() => (renaming = project?.name ?? '')}
        >
          {project.name}
        </button>
      {/if}

      <span class="divider"></span>

      <div
        class="tabs"
        use:dropTarget={{
          accepts: (p) => p.kind === 'files' && (p.data as string[]).some(mapOfIt),
          ondrop: (e) => documentsIn((e.payload.data as string[]).filter(mapOfIt)),
        }}
      >
        <MapTabs
          {project}
          current={pane.map}
          beside={panes.length > 1 ? panes[1 - focused]?.map : null}
          onselect={(id) => show(id)}
          onbeside={beside}
          ondocument={async () => documentsIn([await chooseDocument()])}
        />
      </div>

      <div class="status" aria-live="polite">
        {#if project.status === 'error'}
          <span class="failed" use:tooltip={project.saveError ?? ''}>
            <CircleAlert size={14} />
            {t('project-not-saved')}
          </span>
        {/if}
      </div>

      <IconButton
        label={t('common-undo')}
        shortcut="Ctrl+Z"
        disabled={!project.canUndo}
        onclick={() => project?.undo()}
      >
        <Undo2 size={16} />
      </IconButton>
      <IconButton
        label={t('project-redo')}
        shortcut="Ctrl+Shift+Z"
        disabled={!project.canRedo}
        onclick={() => project?.redo()}
      >
        <Redo2 size={16} />
      </IconButton>

      <span class="divider"></span>

      <Segmented
        value={pane.mode}
        label={t('project-view')}
        options={[
          { value: 'diagram', label: t('project-diagram'), icon: Network },
          { value: 'text', label: t('project-text'), icon: FileText },
        ]}
        onchange={(mode) => (panes[focused] = { ...pane, mode })}
      />

      <IconButton
        label={panes.length > 1 ? t('project-one-at-a-time') : t('project-side-by-side')}
        active={panes.length > 1}
        onclick={sideBySide}
      >
        <Columns2 size={16} />
      </IconButton>
      <IconButton
        label={t('project-references')}
        shortcut="Ctrl+Shift+R"
        active={showReferences}
        onclick={() => side('references')}
      >
        <BookMarked size={16} />
      </IconButton>
      <IconButton
        label={t('project-pictures')}
        shortcut="Ctrl+Shift+P"
        active={showPictures}
        onclick={() => side('pictures')}
      >
        <Images size={16} />
      </IconButton>
      <IconButton
        label={t('project-preview')}
        shortcut="Ctrl+P"
        active={showPreview}
        onclick={() => (showPreview = !showPreview)}
      >
        <BookOpenText size={16} />
      </IconButton>

      {#if shared?.connection}
        <Presence people={project.others} />
      {/if}
      <span
        class="share"
        class:shared={shared?.shared}
        data-status={shared?.connection?.status ?? 'none'}
      >
        <IconButton
          label={!shared?.shared
            ? t('project-share')
            : shared.connection?.status === 'connected'
              ? t('project-shared')
              : t('project-shared-offline')}
          onclick={() => (showShare = true)}
        >
          <Users size={16} />
        </IconButton>
      </span>
    </header>

    <div
      class="work"
      bind:this={work}
      use:dropTarget={{ accepts: ['files'], ondrop: filesDropped }}
    >
      <div class="panes" class:two={panes.length > 1}>
        {#each panes as p, i (i)}
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
            style:flex-grow={panes.length > 1 ? (i === 0 ? sizes.split : 1 - sizes.split) : 1}
            class:focused={panes.length > 1 && i === focused}
            onpointerdowncapture={() => (focused = i)}
            onfocusin={() => (focused = i)}
          >
            {#if panes.length > 1}
              <div class="pane-head">
                <span class="pane-name truncate">{project.map(p.map)?.name}</span>
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
                  ]}
                  onchange={(mode) => (panes[i] = { ...p, mode })}
                />
                <IconButton label={t('project-close-side')} size="sm" onclick={() => closePane(i)}>
                  <X size={14} />
                </IconButton>
              </div>
            {/if}
            <div class="pane-body">
              {#key `${p.map}:${p.mode}`}
                {#if p.mode === 'diagram'}
                  <MapDiagram
                    {project}
                    mapId={p.map}
                    camera={cameras[p.map] ?? null}
                    oncamera={(c) => (cameras[p.map] = c)}
                    onkeep={keep}
                    onopenmap={(id) => show(id, { pane: i })}
                    reveal={i === focused ? reveal : null}
                  />
                {:else}
                  <MapText
                    bind:this={texts[i]}
                    {project}
                    mapId={p.map}
                    onkeep={keep}
                    onopenmap={(id) => show(id, { pane: i })}
                    reveal={i === focused ? reveal : null}
                    {folding}
                  />
                {/if}
              {/key}
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
          <PreviewPanel
            {project}
            {projectId}
            mapId={pane.map}
            onclose={() => (showPreview = false)}
          />
        </div>
      {/if}
      {#if showReferences || showPictures}
        <Divider
          label={showPictures ? t('project-between-pictures') : t('project-between-references')}
          onstart={() => measure('references')}
          onmove={(dx) => moveSide('references', dx)}
          onreset={() => (sizes.references = 0)}
        />
        <div
          class="side"
          bind:this={referencesEl}
          style:width={sizes.references ? `${sizes.references}px` : undefined}
        >
          {#if showPictures}
            <PicturePanel
              {project}
              mapId={pane.map}
              bind:scope={pictureScope}
              onclose={() => (showPictures = false)}
              onopenmap={(id) => show(id)}
            />
          {:else}
            <ReferencePanel {project} mapId={pane.map} onclose={() => (showReferences = false)} />
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <EditorHost bind:this={host} {project} />
  <DocumentHost />
  <FoundHost {project} onkeep={keep} />
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
  }
  .name {
    max-width: 260px;
    flex: none;
    padding: 3px 8px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    font-size: 15.5px;
    font-weight: 600;
    letter-spacing: -0.005em;
    cursor: pointer;
  }
  .name:hover {
    background: var(--paper-hover);
  }
  input.name {
    font-family: var(--font-text);
    background: var(--paper-raised);
    outline: none;
    box-shadow: 0 0 0 1.5px var(--accent);
    cursor: text;
  }
  .divider {
    width: 1px;
    height: 18px;
    margin: 0 6px;
    flex: none;
    background: var(--line);
  }
  .tabs {
    flex: 1;
    min-width: 0;
    height: 100%;
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
  .pane-head {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    flex: none;
    padding: 0 6px 0 14px;
    border-bottom: 1px solid var(--line);
    background: var(--paper-sunken);
  }
  .pane.focused .pane-head {
    background: var(--accent-softer);
  }
  .pane-name {
    flex: 1;
    font-weight: 550;
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .pane.focused .pane-name {
    color: var(--accent-strong);
  }
  .pane-body {
    flex: 1;
    min-height: 0;
    position: relative;
  }
  .side {
    width: 340px;
    max-width: 70%;
    flex: none;
    min-height: 0;
  }
  .side.wide {
    width: min(46%, 640px);
  }
</style>

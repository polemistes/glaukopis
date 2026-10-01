<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import BookOpenText from '@lucide/svelte/icons/book-open-text';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import CloudDownload from '@lucide/svelte/icons/cloud-download';
  import Columns2 from '@lucide/svelte/icons/columns-2';
  import FileText from '@lucide/svelte/icons/file-text';
  import Network from '@lucide/svelte/icons/network';
  import PanelRight from '@lucide/svelte/icons/panel-right';
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
  import { bringIn, chooseDocument } from '$lib/documents/bringing.svelte';
  import DocumentHost from '$lib/documents/DocumentHost.svelte';
  import { goThrough, takeWaiting } from '$lib/found/found.svelte';
  import FoundHost from '$lib/found/FoundHost.svelte';
  import { pictures } from '$lib/figures/pictures.svelte';
  import { picturesUi, type PictureScope } from '$lib/pictures/store.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import { notify } from '$lib/ui/toast.svelte';
  import CommentsPanel from '$lib/comments/CommentsPanel.svelte';
  import { selectedPassage } from '$lib/comments/marks';
  import { commentsUi } from '$lib/comments/ui.svelte';
  import EditorHost from '$lib/editor/EditorHost.svelte';
  import { editorUi, hooksOf } from '$lib/editor/ui.svelte';
  import { beforeClose } from '$lib/state/closing';
  import { library } from '$lib/state/library.svelte';
  import { openProject, projects } from '$lib/state/projects.svelte';
  import { jumpFor } from '$lib/search/everything.svelte';
  import { takeCitations } from '$lib/library/citing.svelte';
  import { router } from '$lib/state/router.svelte';
  import { shortcuts } from '$lib/shell/keys.svelte';
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
  import KindsDialog from './KindsDialog.svelte';
  import { kindsUi } from './kinds.svelte';
  import { filesDropped, mapOfIt } from './drops';
  import {
    arranged,
    clamp,
    sideWidth,
    toStore,
    withoutGone,
    type Pane,
    type Sizes,
    type StoredView,
    GIVEN,
  } from './layout';
  import MapTabs from './MapTabs.svelte';
  import type { Project } from './model/project.svelte';
  import PicturePanel from './PicturePanel.svelte';
  import ReferencePanel from './ReferencePanel.svelte';
  import SideTabs, { type SideKind } from './SideTabs.svelte';
  import MapText from './text/MapText.svelte';
  import PreviewPanel from '$lib/preview/PreviewPanel.svelte';
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
  let renaming = $state<string | null>(null);
  let host = $state<ReturnType<typeof EditorHost>>();
  /** An element to show when a map is opened by a jump. */
  let reveal = $state<string | null>(null);
  /** A reference to show at the references, with where it is cited, as the library asked. */
  let citationsOf = $state<string | null>(null);
  let release: (() => void) | undefined;
  let shared = $state<ProjectSharing | null>(null);
  let showShare = $state(false);
  /** What was kept of the view, until there are maps to show. */
  let stored: StoredView = {};
  /** What is folded away in the text: as it was left, and for every map of the project. */
  let folding = $state.raw(new Folding());
  /** The texts of the maps in the panes, where a pane shows the text: to be searched. */
  let texts = $state<(ReturnType<typeof MapText> | undefined)[]>([]);
  /** The diagrams of the maps in the panes, where a pane shows the diagram. */
  let diagrams = $state<(ReturnType<typeof MapDiagram> | undefined)[]>([]);

  const pane = $derived(panes[Math.min(focused, panes.length - 1)]);

  /** The review of the changes of the map in view, while its panel is open (ADR 0022). */
  let review = $state<Review | null>(null);
  provideReviewing({
    get review() {
      return review;
    },
  });

  /** Opens the panel of changes beside the text, or closes it. */
  function toggleReview(open = !review) {
    if (!open || !project || !pane) {
      review?.close();
      review = null;
      if (sideKind === 'changes') sideKind = null;
      return;
    }
    sideKind = lastSide = 'changes';
    if (review) return;
    // The changes are shown in the text: the pane shows it.
    if (pane.mode !== 'text') panes[focused] = { ...pane, mode: 'text' };
    looking = null;
    review = new Review(project, sourceFor(project, ownId), pane.map);
    review.later(0);
  }

  // The review follows the map in view, and what is written.
  $effect(() => {
    const map = pane?.map;
    if (map) untrack(() => review?.turnTo(map));
  });

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
      // The library asked where a work is cited in this project.
      citationsOf = takeCitations(ownId);
      if (citationsOf) side('references', true);
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
    const route = router.route.view === 'project' ? router.route : null;
    const laid = arranged(p.maps, stored, route);
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

  onDestroy(() => {
    review?.close();
    comparing.copy = null;
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
      project?.maps ?? [],
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
    void panes.map((p) => `${p.map}${p.mode}`);
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
    router.replace({ view: 'project', project: projectId, map: panes[0].map, mode: panes[0].mode });
  });

  // A map that is gone cannot be shown.
  $effect(() => {
    if (!project) return;
    const next = withoutGone(panes, project.maps);
    if (next) {
      panes = next;
      focused = Math.min(focused, next.length - 1);
    }
  });

  function show(map: string, options: { pane?: number; element?: string } = {}) {
    const i = options.pane ?? focused;
    if (!panes[i]) return;
    // Set anew, so that an element asked for again is shown again.
    reveal = null;
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
    if (commentsUi.asked) untrack(() => side('comments', true));
  });

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

  /** The text of the map in view is searched; from the diagram, the text is turned to first. */
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
      'side-references': () => side('references'),
      // Not Ctrl+Shift+I, which the window keeps for itself while the application is being developed.
      'side-pictures': () => side('pictures'),
      'side-comments': () => side('comments'),
      comment: { run: beginComment, when: () => !!project },
      'side-history': () => side('history'),
      'side-changes': () => toggleReview(),
      'side-panel': () => (sideKind ? closeSide() : side(lastSide, true)),
      'side-by-side': sideBySide,
      share: () => (showShare = true),
      'text-outline': {
        run: () => {
          if (pane && pane.mode !== 'text') panes[focused] = { ...pane, mode: 'text' };
          showOutline = pane?.mode === 'text' ? !showOutline : true;
        },
        when: () => !!pane,
      },
      find: { run: () => findInText(false), when: () => !!pane },
      replace: { run: () => findInText(true), when: () => !!pane },
      undo: { run: () => project?.undo(), when: () => !!project },
      redo: { run: () => project?.redo(), when: () => !!project },
      'redo-y': { run: () => project?.redo(), when: () => !!project },
      'review-next': { run: () => review?.next(), when: reviewing },
      'review-previous': { run: () => review?.previous(), when: reviewing },
      'review-accept': { run: () => void review?.accept(), when: reviewing },
      'review-reject': { run: () => void review?.reject(), when: reviewing },
    });
  });
</script>

<svelte:window {onblur} />

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
        label={t('project-side')}
        active={!!sideKind}
        onclick={() => (sideKind ? closeSide() : side(lastSide, true))}
      >
        <PanelRight size={16} />
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
        data-status={shared?.connection?.tooLarge
          ? 'refused'
          : (shared?.connection?.status ?? 'none')}
      >
        <IconButton
          label={!shared?.shared
            ? t('project-share')
            : shared.connection?.tooLarge
              ? t('project-shared-too-large')
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
      use:dropTarget={{
        accepts: ['files'],
        ondrop: (e) => filesDropped(e, { project, documentsIn, keep }),
      }}
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
                {#if looking && looking.pane === i}
                  <PastView {project} map={p.map} {looking} onback={() => (looking = null)} />
                {:else if p.mode === 'diagram'}
                  <MapDiagram
                    bind:this={diagrams[i]}
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
                    outline={showOutline}
                    ontoggleoutline={() => (showOutline = !showOutline)}
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
      {#if sideKind}
        {#snippet tabs()}
          <SideTabs current={sideKind ?? lastSide} onpick={(kind) => side(kind, true)} />
        {/snippet}
        <Divider
          label={sideKind === 'pictures'
            ? t('project-between-pictures')
            : sideKind === 'history'
              ? t('history-between')
              : sideKind === 'comments'
                ? t('comments-between')
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
          {#if sideKind === 'changes' && review}
            <ReviewPanel {review} head={tabs} onclose={closeSide} />
          {:else if sideKind === 'history'}
            <HistoryPanel
              {project}
              history={historyOf(project, ownId)}
              {looking}
              pane={focused}
              onlook={(l) => (looking = l)}
              head={tabs}
              onclose={closeSide}
            />
          {:else if sideKind === 'comments'}
            <CommentsPanel
              {project}
              mapId={pane.map}
              head={tabs}
              onclose={closeSide}
              ongo={(map, element) => show(map, { element })}
            />
          {:else if sideKind === 'pictures'}
            <PicturePanel
              {project}
              mapId={pane.map}
              bind:scope={pictureScope}
              head={tabs}
              onclose={closeSide}
              onopenmap={(id) => show(id)}
            />
          {:else}
            <ReferencePanel
              {project}
              mapId={pane.map}
              head={tabs}
              onclose={closeSide}
              show={citationsOf}
              ongo={(map, element) => show(map, { element })}
            />
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <EditorHost bind:this={host} {project} />
  <DocumentHost />
  <FoundHost {project} onkeep={keep} />
{/if}

{#if comparing.copy && project}
  <CopyDialog
    {project}
    id={comparing.copy}
    onclose={() => (comparing.copy = null)}
    ongo={(map, element) => show(map, { element })}
  />
{/if}

{#if kindsUi.editing && project}
  {#key kindsUi.editing.id}
    <KindDialog
      {project}
      id={kindsUi.editing.id}
      assign={kindsUi.editing.assign}
      onclose={() => (kindsUi.editing = null)}
    />
  {/key}
{/if}

{#if kindsUi.managing && project}
  <KindsDialog {project} onclose={() => (kindsUi.managing = false)} />
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

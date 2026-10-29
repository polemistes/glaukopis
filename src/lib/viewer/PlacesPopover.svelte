<script lang="ts">
  /**
   * The bookmarks of a file and its own contents (ADR 0072), in one list
   * from the bar of a file side: *Mark this place* at the top, then the
   * bookmarks in the order their places stand, each going to its place,
   * renamed or removed from its menu; then the contents the file carries of
   * its own headings, indented by depth, each going to the top of its page.
   * The bookmarks are kept with the file in the library, so they are the
   * same from every project.
   */
  import { tick, untrack } from 'svelte';
  import BookmarkIcon from '@lucide/svelte/icons/bookmark';
  import BookmarkPlus from '@lucide/svelte/icons/bookmark-plus';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Pencil from '@lucide/svelte/icons/pencil';
  import X from '@lucide/svelte/icons/x';
  import { fileBookmarksSet, type Bookmark } from '$lib/api/files';
  import type { ContentsEntry } from '$lib/api/viewer';
  import { files } from '$lib/files/store.svelte';
  import { t } from '$lib/i18n';
  import { openMenu } from '$lib/ui/menu.svelte';
  import Popover from '$lib/ui/Popover.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import { defaultName, renamed, withBookmark, without } from './bookmarks';
  import type { Place } from './pages';

  interface Props {
    anchor: HTMLElement | null;
    /** The hash of the file. */
    file: string;
    labels: string[];
    outline: ContentsEntry[];
    /** Whether it opens with a bookmark being named, as Ctrl+Shift+B opens it. */
    marking: boolean;
    /** Where the view stands now. */
    here: () => Place;
    ongo: (place: Place) => void;
    onclose: () => void;
  }

  let { anchor, file, labels, outline, marking, here, ongo, onclose }: Props = $props();

  const list = $derived(files.get(file)?.bookmarks ?? []);

  // ---- marking the place in view ----

  let naming = $state<{ place: Place; name: string } | null>(null);
  let field = $state<HTMLInputElement>();

  async function beginMarking() {
    const place = here();
    naming = {
      place,
      name: defaultName(place, labels, (l) => t('viewer-bookmark-page', { label: l })),
    };
    await tick();
    field?.focus();
    field?.select();
  }

  // Opened to mark the place, it begins naming at once. It depends on that alone.
  $effect(() => {
    if (marking && anchor) untrack(() => void beginMarking());
  });

  /** Keeps the bookmarks of the file, as the library gives the file back. */
  async function keep(next: Bookmark[]) {
    try {
      files.put(await fileBookmarksSet(file, next));
    } catch (e) {
      notifyError(t('viewer-bookmark-not-kept'), e);
    }
  }

  function keepNamed(event: Event) {
    event.preventDefault();
    const now = naming;
    naming = null;
    if (!now) return;
    const made = withBookmark(list, now.place, now.name);
    if (made) void keep(made.list);
  }

  // ---- a bookmark's menu ----

  let renaming = $state<{ id: string; name: string } | null>(null);
  let renameField = $state<HTMLInputElement>();

  async function beginRenaming(mark: Bookmark) {
    renaming = { id: mark.id, name: mark.name };
    await tick();
    renameField?.focus();
    renameField?.select();
  }

  function keepRenamed(event: Event) {
    event.preventDefault();
    const now = renaming;
    renaming = null;
    if (now) void keep(renamed(list, now.id, now.name));
  }

  function menu(anchorAt: HTMLElement, mark: Bookmark) {
    openMenu(
      anchorAt,
      [
        {
          label: t('viewer-bookmark-rename'),
          icon: Pencil,
          action: () => void beginRenaming(mark),
        },
        {
          label: t('viewer-bookmark-remove'),
          icon: X,
          action: () => void keep(without(list, mark.id)),
        },
      ],
      { side: 'bottom', align: 'end' },
    );
  }

  function go(place: Place) {
    ongo(place);
    onclose();
  }

  /** Escape in a field leaves the field, not the list. */
  function fieldKey(event: KeyboardEvent, leave: () => void) {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      leave();
    }
  }
</script>

<Popover open={!!anchor} {anchor} width={320} label={t('viewer-places')} {onclose}>
  <div class="places" data-viewer-places-list>
    {#if naming}
      <form class="naming" onsubmit={keepNamed}>
        <BookmarkPlus size={14} />
        <input
          bind:this={field}
          bind:value={naming.name}
          aria-label={t('viewer-bookmark-name')}
          data-bookmark-name
          onkeydown={(e) => fieldKey(e, () => (naming = null))}
        />
      </form>
    {:else}
      <button type="button" class="here" data-bookmark-here onclick={() => void beginMarking()}>
        <BookmarkPlus size={14} />
        <span>{t('viewer-bookmark-here')}</span>
      </button>
    {/if}

    <h3>{t('viewer-bookmarks')}</h3>
    {#if list.length}
      <ul>
        {#each list as mark (mark.id)}
          <li data-bookmark={mark.id}>
            {#if renaming?.id === mark.id}
              <form class="naming" onsubmit={keepRenamed}>
                <input
                  bind:this={renameField}
                  bind:value={renaming.name}
                  aria-label={t('viewer-bookmark-name')}
                  data-bookmark-rename
                  onkeydown={(e) => fieldKey(e, () => (renaming = null))}
                />
              </form>
            {:else}
              <button
                type="button"
                class="go"
                data-bookmark-go
                onclick={() => go({ page: mark.page, at: mark.at })}
                oncontextmenu={(e) => {
                  e.preventDefault();
                  menu(e.currentTarget, mark);
                }}
              >
                <BookmarkIcon size={13} />
                <span class="name">{mark.name}</span>
                <span class="page">{labels[mark.page - 1] ?? mark.page}</span>
              </button>
              <button
                type="button"
                class="more"
                aria-label={t('viewer-bookmark-rename')}
                data-bookmark-menu
                onclick={(e) => menu(e.currentTarget, mark)}
              >
                <Ellipsis size={14} />
              </button>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="none">{t('viewer-bookmarks-none')}</p>
    {/if}

    <h3>{t('viewer-contents')}</h3>
    {#if outline.length}
      <ul class="contents">
        {#each outline as entry, i (i)}
          <li>
            <button
              type="button"
              class="go"
              style:padding-left="{8 + (entry.depth - 1) * 12}px"
              data-contents-page={entry.page}
              onclick={() => go({ page: entry.page, at: 0 })}
            >
              <span class="name">{entry.title}</span>
              <span class="page">{labels[entry.page - 1] ?? entry.page}</span>
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="none">{t('viewer-contents-none')}</p>
    {/if}
  </div>
</Popover>

<style>
  .places {
    max-height: min(520px, 70vh);
    overflow-y: auto;
    padding: 6px;
    font-size: var(--text-sm);
  }
  h3 {
    margin: 10px 8px 4px;
    color: var(--ink-3);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
  }
  .here,
  .go {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    height: 28px;
    padding: 0 8px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .here {
    width: 100%;
    color: var(--accent);
  }
  .here:hover,
  .go:hover,
  .more:hover {
    background: var(--paper-hover);
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .page {
    flex: none;
    color: var(--ink-3);
    font-size: var(--text-xs);
    font-variant-numeric: tabular-nums;
  }
  .more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .naming {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    padding: 2px 8px;
    color: var(--accent);
  }
  .naming input {
    flex: 1;
    min-width: 0;
    height: 26px;
    padding: 0 6px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  .none {
    margin: 2px 8px 6px;
    color: var(--ink-3);
  }
</style>

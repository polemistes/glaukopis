<script lang="ts">
  /**
   * The column at the left of the page of the notebook (stage 2), as the
   * library has its collections: All notes, then the boxes in their order,
   * each with how many notes it holds, the one in view marked; under them
   * the tags, as words are sorted, each with how many notes have it, those
   * that are on marked. A box is made with the + and named in place,
   * renamed by two presses or F2, reordered by dragging its row, deleted
   * from its menu or by Delete (asked first where it holds notes, which go
   * to the first box). Notes dragged onto a box move to it. A tag pressed is
   * on, pressed again off; its menu renames it, which makes it one with a
   * tag of the new name, or removes it from all notes.
   */
  import { tick } from 'svelte';
  import Box from '@lucide/svelte/icons/box';
  import Inbox from '@lucide/svelte/icons/inbox';
  import Layers from '@lucide/svelte/icons/layers';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import Tag from '@lucide/svelte/icons/tag';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { languages, t } from '$lib/i18n';
  import { confirm } from '$lib/ui/confirm.svelte';
  import { dropTarget, startDrag, type DropEvent } from '$lib/ui/drag.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu } from '$lib/ui/menu.svelte';
  import { FIRST_BOX } from './model/boxes';
  import type { Notebook } from './model/notebook.svelte';
  import { cleanTag } from './model/tags';
  import type { BoxRecord } from './model/types';
  import { boxName, dropBefore, NOTES_DRAGGED, renamedTag, toggledTag } from './page.svelte';

  /** What a box is dragged as, among the others: its id. */
  const BOX_DRAGGED = 'notebook-box';

  interface Props {
    notebook: Notebook;
    /** The box in view; null for all notes. */
    box: string | null;
    /** The tags that are on. */
    tags: readonly string[];
    onchoose: (box: string | null) => void;
    ontags: (tags: string[]) => void;
    /** Notes dropped on a box: the page moves them. */
    onmoveto: (ids: string[], box: string) => void;
    /** A box deleted. */
    ondeleted?: (box: string) => void;
  }

  let { notebook, box, tags, onchoose, ontags, onmoveto, ondeleted }: Props = $props();

  /** The box or the tag being named in place: a box by its id, or 'new'. */
  let naming = $state<
    | { what: 'box'; id: string | 'new'; value: string }
    | { what: 'tag'; tag: string; value: string }
    | null
  >(null);
  let input = $state<HTMLInputElement>();
  /** Where a box dragged over a row would be put: above it or below it. */
  let line = $state<{ id: string; lower: boolean } | null>(null);

  const counts = $derived.by(() => {
    const out = new Map<string, number>();
    for (const n of notebook.notes.values()) out.set(n.box, (out.get(n.box) ?? 0) + 1);
    return out;
  });
  const order = $derived(notebook.boxes.map((b) => b.id));

  const number = (n: number) => n.toLocaleString(languages.current);

  /** What is typed in the field of a name, kept apart so that the field outlives what it names. */
  let typed = $state('');

  async function nameInPlace(next: NonNullable<typeof naming>) {
    naming = next;
    typed = next.value;
    await tick();
    input?.focus();
    input?.select();
  }

  /** Begins a new box, named in place at the end of the boxes. */
  export function newBox() {
    void nameInPlace({ what: 'box', id: 'new', value: '' });
  }

  function renameBox(b: BoxRecord) {
    void nameInPlace({ what: 'box', id: b.id, value: b.name });
  }

  function renameTag(tag: string) {
    void nameInPlace({ what: 'tag', tag, value: tag });
  }

  async function commit() {
    if (!naming) return;
    const n = { ...naming, value: typed };
    naming = null;
    if (n.what === 'box') {
      if (n.id === 'new') {
        if (!n.value.trim()) return;
        notebook.checkpoint();
        const id = notebook.addBox(n.value);
        notebook.checkpoint();
        onchoose(id);
      } else {
        notebook.checkpoint();
        notebook.renameBox(n.id, n.value);
        notebook.checkpoint();
      }
      return;
    }
    const to = cleanTag(n.value);
    if (!to || to === n.tag) return;
    if (notebook.tags.some((x) => x.tag === to)) {
      const ok = await confirm({
        title: t('notebook-tag-merge-title', { from: n.tag, to }),
        message: t('notebook-tag-merge-message', { from: n.tag, to }),
        confirm: t('common-rename'),
      });
      if (!ok) return;
    }
    notebook.checkpoint();
    notebook.renameTag(n.tag, to);
    notebook.checkpoint();
    ontags(renamedTag(tags, n.tag, to));
  }

  async function deleteBox(b: BoxRecord) {
    if (b.id === FIRST_BOX) return;
    const count = counts.get(b.id) ?? 0;
    if (count) {
      const ok = await confirm({
        title: t('notebook-box-delete-title', { name: boxName(b) }),
        message: t('notebook-box-delete-message', {
          count,
          first: boxName(notebook.boxes[0]),
        }),
        confirm: t('common-delete'),
        danger: true,
      });
      if (!ok) return;
    }
    notebook.checkpoint();
    notebook.deleteBox(b.id);
    notebook.checkpoint();
    if (box === b.id) onchoose(FIRST_BOX);
    ondeleted?.(b.id);
  }

  async function removeTag(tag: string, count: number) {
    const ok = await confirm({
      title: t('notebook-tag-remove-title', { tag }),
      message: t('notebook-tag-remove-message', { count }),
      confirm: t('notebook-tag-remove'),
      danger: true,
    });
    if (!ok) return;
    notebook.checkpoint();
    notebook.deleteTag(tag);
    notebook.checkpoint();
    ontags(tags.filter((x) => x !== tag));
  }

  function boxMenu(event: MouseEvent, b: BoxRecord) {
    openContextMenu(event, [
      { label: t('common-rename'), icon: Pencil, shortcut: 'F2', action: () => renameBox(b) },
      ...(b.id === FIRST_BOX
        ? []
        : [
            {
              label: t('common-delete'),
              icon: Trash2,
              danger: true,
              shortcut: 'Del',
              action: () => void deleteBox(b),
            },
          ]),
    ]);
  }

  function tagMenu(event: MouseEvent, tag: string, count: number) {
    openContextMenu(event, [
      { label: t('common-rename'), icon: Pencil, shortcut: 'F2', action: () => renameTag(tag) },
      {
        label: t('notebook-tag-remove'),
        icon: Trash2,
        danger: true,
        action: () => void removeTag(tag, count),
      },
    ]);
  }

  function boxKey(event: KeyboardEvent, b: BoxRecord) {
    if (event.key === 'F2') renameBox(b);
    else if (event.key === 'Delete' && b.id !== FIRST_BOX) void deleteBox(b);
    else if (event.key === 'Enter' || event.key === ' ') onchoose(b.id);
    else return;
    event.preventDefault();
  }

  function tagKey(event: KeyboardEvent, tag: string) {
    if (event.key !== 'F2') return;
    event.preventDefault();
    renameTag(tag);
  }

  /** Whether the pointer of a drag is in the lower half of a row. */
  function lowerHalf(event: DropEvent): boolean {
    const r = event.target.getBoundingClientRect();
    return event.y > r.top + r.height / 2;
  }

  function overBox(event: DropEvent | null, b: BoxRecord) {
    if (!event || event.payload.kind !== BOX_DRAGGED) {
      if (line?.id === b.id) line = null;
      return;
    }
    line = { id: b.id, lower: b.id === FIRST_BOX || lowerHalf(event) };
  }

  function dropOnBox(event: DropEvent, b: BoxRecord) {
    line = null;
    if (event.payload.kind === NOTES_DRAGGED) {
      onmoveto(event.payload.data as string[], b.id);
      return;
    }
    if (event.payload.kind !== BOX_DRAGGED) return;
    const dragged = event.payload.data as string;
    notebook.checkpoint();
    notebook.moveBox(dragged, dropBefore(order, b.id, b.id === FIRST_BOX || lowerHalf(event)));
    notebook.checkpoint();
  }
</script>

{#snippet nameField(label: string, Icon: typeof Box)}
  <div class="item naming">
    <Icon size={15} strokeWidth={1.6} />
    <input
      bind:this={input}
      bind:value={typed}
      placeholder={label}
      aria-label={label}
      spellcheck="false"
      data-naming
      onblur={() => void commit()}
      onkeydown={(e) => {
        if (e.key === 'Enter') void commit();
        else if (e.key === 'Escape') naming = null;
        e.stopPropagation();
      }}
    />
  </div>
{/snippet}

<div class="column" data-box-column>
  <button
    type="button"
    class="item all"
    class:selected={box === null}
    aria-pressed={box === null}
    data-box-row="all"
    onclick={() => onchoose(null)}
  >
    <Layers size={15} strokeWidth={1.6} />
    <span class="name truncate">{t('notebook-all-notes')}</span>
    <span class="count">{number(notebook.notes.size)}</span>
  </button>

  <div class="heading">
    <span class="overline">{t('notebook-boxes')}</span>
    <IconButton label={t('notebook-box-new')} size="sm" data-new-box onclick={newBox}>
      <Plus size={14} />
    </IconButton>
  </div>

  {#each notebook.boxes as b (b.id)}
    {@const Icon = b.id === FIRST_BOX ? Inbox : Box}
    {#if naming?.what === 'box' && naming.id === b.id}
      {@render nameField(t('notebook-box-name'), Icon)}
    {:else}
      <div
        class="item"
        class:selected={box === b.id}
        class:above={line?.id === b.id && !line.lower}
        class:below={line?.id === b.id && line.lower}
        role="button"
        tabindex="0"
        aria-pressed={box === b.id}
        data-box-row={b.id}
        use:dropTarget={{
          accepts: (p) => p.kind === NOTES_DRAGGED || (p.kind === BOX_DRAGGED && p.data !== b.id),
          onover: (e) => overBox(e, b),
          ondrop: (e) => dropOnBox(e, b),
        }}
        onclick={() => onchoose(b.id)}
        ondblclick={() => renameBox(b)}
        oncontextmenu={(e) => {
          e.preventDefault();
          boxMenu(e, b);
        }}
        onkeydown={(e) => boxKey(e, b)}
        onpointerdown={(e) =>
          startDrag(e, () =>
            b.id === FIRST_BOX ? null : { kind: BOX_DRAGGED, data: b.id, label: boxName(b) },
          )}
      >
        <Icon size={15} strokeWidth={1.6} />
        <span class="name truncate">{boxName(b)}</span>
        <span class="count">{number(counts.get(b.id) ?? 0)}</span>
      </div>
    {/if}
  {/each}
  {#if naming?.what === 'box' && naming.id === 'new'}
    {@render nameField(t('notebook-box-name'), Box)}
  {/if}

  {#if notebook.tags.length}
    <div class="heading tags-heading">
      <span class="overline">{t('notebook-tags')}</span>
    </div>
    {#each notebook.tags as { tag, count } (tag)}
      {#if naming?.what === 'tag' && naming.tag === tag}
        {@render nameField(t('notebook-tag-name'), Tag)}
      {:else}
        <button
          type="button"
          class="item"
          class:selected={tags.includes(tag)}
          aria-pressed={tags.includes(tag)}
          data-tag-row={tag}
          onclick={() => ontags(toggledTag(tags, tag))}
          oncontextmenu={(e) => {
            e.preventDefault();
            tagMenu(e, tag, count);
          }}
          onkeydown={(e) => tagKey(e, tag)}
        >
          <Tag size={14} strokeWidth={1.6} />
          <span class="name truncate">{tag}</span>
          <span class="count">{number(count)}</span>
        </button>
      {/if}
    {/each}
  {/if}
</div>

<style>
  .column {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 10px 8px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    height: 30px;
    flex: none;
    padding: 0 8px 0 12px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .item:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .item.selected {
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-weight: 500;
  }
  .item:global([data-drop-over]) {
    background: var(--accent-soft);
    box-shadow: inset 0 0 0 1.5px var(--accent);
  }
  /* Where a box dragged among the others will stand. */
  .item.above:global([data-drop-over]) {
    background: transparent;
    box-shadow: inset 0 2px 0 var(--accent);
  }
  .item.below:global([data-drop-over]) {
    background: transparent;
    box-shadow: inset 0 -2px 0 var(--accent);
  }
  .name {
    flex: 1;
    min-width: 0;
  }
  .count {
    font-size: var(--text-xs);
    color: var(--ink-4);
    font-variant-numeric: tabular-nums;
  }
  .selected .count {
    color: var(--accent);
  }
  .heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 24px;
    padding: 14px 4px 2px 12px;
  }
  .tags-heading {
    padding-top: 18px;
  }
  .naming {
    cursor: text;
    background: var(--paper-raised);
    box-shadow: inset 0 0 0 1.5px var(--accent);
  }
  .naming input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    outline: none;
    color: var(--ink);
    font: inherit;
  }
</style>

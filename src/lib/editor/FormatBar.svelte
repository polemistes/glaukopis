<script lang="ts">
  import Bold from '@lucide/svelte/icons/bold';
  import Italic from '@lucide/svelte/icons/italic';
  import List from '@lucide/svelte/icons/list';
  import Quote from '@lucide/svelte/icons/quote';
  import Strikethrough from '@lucide/svelte/icons/strikethrough';
  import Subscript from '@lucide/svelte/icons/subscript';
  import Superscript from '@lucide/svelte/icons/superscript';
  import { TextSelection, type Command } from 'prosemirror-state';
  import { place } from '$lib/ui/floating';
  import { tooltip } from '$lib/ui/tooltip';
  import { insertFootnote, toggle, toggleList, toggleQuote } from './commands';
  import { editorUi } from './ui.svelte';
  import { hooksOf } from './views.svelte';

  let el = $state<HTMLDivElement>();

  const s = $derived(editorUi.selection);
  const shown = $derived(
    !!s && !s.empty && !editorUi.selecting && !editorUi.picking && !editorUi.citation,
  );

  $effect(() => {
    if (!shown || !el || !s) return;
    place(el, s.rect, { side: 'top', align: 'center', gap: 8 });
  });

  function run(command: Command) {
    const view = editorUi.selection?.view;
    if (!view) return;
    command(view.state, view.dispatch, view);
    view.focus();
  }

  /** A note opens a panel of its own, which takes the cursor: it is not taken back. */
  function note() {
    const view = editorUi.selection?.view;
    if (view) insertFootnote(view.state, view.dispatch, view);
  }

  function cite() {
    const view = editorUi.selection?.view;
    if (!view) return;
    // The citation goes after what is selected, not in its place.
    const { to } = view.state.selection;
    view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(to), -1)));
    hooksOf.get(view)?.cite?.(view, false);
  }
</script>

{#if shown && s}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="bar"
    bind:this={el}
    role="toolbar"
    aria-label="Format"
    tabindex="-1"
    onmousedown={(e) => e.preventDefault()}
  >
    <button
      class:on={s.marks.em}
      aria-label="Italic"
      use:tooltip={{ text: 'Italic', shortcut: 'Ctrl+I', side: 'top' }}
      onclick={() => run(toggle('em'))}
    >
      <Italic size={15} />
    </button>
    {#if s.kind !== 'title'}
      <button
        class:on={s.marks.strong}
        aria-label="Bold"
        use:tooltip={{ text: 'Bold', shortcut: 'Ctrl+B', side: 'top' }}
        onclick={() => run(toggle('strong'))}
      >
        <Bold size={15} />
      </button>
    {/if}
    <button
      class:on={s.marks.smallcaps}
      class="caps"
      aria-label="Small capitals"
      use:tooltip={{ text: 'Small capitals', shortcut: 'Ctrl+Shift+K', side: 'top' }}
      onclick={() => run(toggle('smallcaps'))}
    >
      <span>Sc</span>
    </button>
    <button
      class:on={s.marks.sup}
      aria-label="Superscript"
      use:tooltip={{ text: 'Superscript', shortcut: 'Ctrl+.', side: 'top' }}
      onclick={() => run(toggle('sup'))}
    >
      <Superscript size={15} />
    </button>
    <button
      class:on={s.marks.sub}
      aria-label="Subscript"
      use:tooltip={{ text: 'Subscript', shortcut: 'Ctrl+,', side: 'top' }}
      onclick={() => run(toggle('sub'))}
    >
      <Subscript size={15} />
    </button>
    {#if s.kind !== 'title'}
      <button
        class:on={s.marks.strike}
        aria-label="Struck through"
        use:tooltip={{ text: 'Struck through', shortcut: 'Ctrl+Shift+X', side: 'top' }}
        onclick={() => run(toggle('strike'))}
      >
        <Strikethrough size={15} />
      </button>
    {/if}
    {#if s.kind === 'body'}
      <span class="rule"></span>
      <button
        class:on={s.quote}
        aria-label="Quotation"
        use:tooltip={{ text: 'Block quotation', shortcut: "Ctrl+'", side: 'top' }}
        onclick={() => run(toggleQuote)}
      >
        <Quote size={15} />
      </button>
      <button
        class:on={s.list}
        aria-label="List"
        use:tooltip={{ text: 'List', shortcut: 'Ctrl+Shift+8', side: 'top' }}
        onclick={() => run(toggleList('bullet_list'))}
      >
        <List size={15} />
      </button>
      <span class="rule"></span>
      <button
        class="word"
        use:tooltip={{ text: 'Make the selection a note', shortcut: 'Ctrl+Alt+F', side: 'top' }}
        onclick={note}
      >
        Note
      </button>
    {/if}
    {#if s.kind !== 'title'}
      <button
        class="word"
        use:tooltip={{ text: 'Cite a work here', shortcut: '@', side: 'top' }}
        onclick={cite}>Cite</button
      >
    {/if}
  </div>
{/if}

<style>
  .bar {
    position: fixed;
    z-index: 650;
    left: 0;
    top: 0;
    display: flex;
    align-items: center;
    gap: 1px;
    padding: 3px;
    background: var(--ink);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-2);
    animation: appear var(--fast) var(--ease);
  }
  @keyframes appear {
    from {
      opacity: 0;
      transform: translateY(3px);
    }
  }
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 26px;
    padding: 0 6px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: color-mix(in srgb, var(--paper) 78%, transparent);
    cursor: pointer;
  }
  button:hover {
    background: color-mix(in srgb, var(--paper) 16%, transparent);
    color: var(--paper);
  }
  button.on {
    background: color-mix(in srgb, var(--paper) 24%, transparent);
    color: var(--paper);
  }
  .caps span {
    font-variant-caps: small-caps;
    font-weight: 600;
    font-size: 13px;
  }
  .word {
    font-size: var(--text-sm);
    font-weight: 500;
    padding: 0 8px;
  }
  .rule {
    width: 1px;
    height: 16px;
    margin: 0 3px;
    background: color-mix(in srgb, var(--paper) 25%, transparent);
  }
</style>

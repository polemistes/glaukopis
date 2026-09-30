<!--
  What can be done where one is, by its name: Ctrl+K. What the keys of the
  application do, and what has no key, as sharing a project.
-->
<script lang="ts">
  import { t } from '$lib/i18n';
  import { fold } from '$lib/state/library.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { KEYS, shortcuts } from './keys.svelte';

  let { onclose }: { onclose: () => void } = $props();

  let query = $state('');
  let active = $state(0);

  const doable = $derived.by(() => {
    void shortcuts.revision;
    // What is done by two keys is there once, by the first of them.
    const seen = new Set<string>();
    return KEYS.filter((k) => k.bound && k.id !== 'palette' && shortcuts.binding(k.id))
      .map((k) => ({ ...k, label: t(`keys-${k.id}`) }))
      .filter((k) => !seen.has(k.label) && !!seen.add(k.label));
  });
  const shown = $derived.by(() => {
    const words = fold(query).split(' ').filter(Boolean);
    return doable.filter((c) => {
      const hay = fold(c.label);
      return words.every((w) => hay.includes(w));
    });
  });

  $effect(() => {
    void query;
    active = 0;
  });

  function run(id: string | undefined) {
    const b = id ? shortcuts.binding(id) : null;
    onclose();
    // After the palette has gone, so that what is done has the window to itself.
    if (b) requestAnimationFrame(() => b.run(new KeyboardEvent('keydown')));
  }

  function onkeydown(event: KeyboardEvent) {
    const n = shown.length;
    if (event.key === 'ArrowDown') active = n ? (active + 1) % n : 0;
    else if (event.key === 'ArrowUp') active = n ? (active - 1 + n) % n : 0;
    else if (event.key === 'Enter') run(shown[active]?.id);
    else return;
    event.preventDefault();
  }
</script>

<Dialog open title={t('keys-palette-title')} width={520} {onclose}>
  <!-- svelte-ignore a11y_autofocus -->
  <input
    class="query"
    bind:value={query}
    placeholder={t('keys-palette-placeholder')}
    aria-label={t('keys-palette-title')}
    autofocus
    data-autofocus
    spellcheck="false"
    {onkeydown}
  />
  <ul class="list" role="listbox" aria-label={t('keys-palette-title')}>
    {#each shown as c, i (c.id)}
      <li
        role="option"
        aria-selected={i === active}
        class:active={i === active}
        onpointermove={() => (active = i)}
        onclick={() => run(c.id)}
        onkeydown={() => {}}
      >
        <span class="label">{c.label}</span>
        {#if c.keys}<kbd>{c.keys}</kbd>{/if}
      </li>
    {:else}
      <li class="none">{t('keys-palette-none')}</li>
    {/each}
  </ul>
  <p class="hint">{t('keys-palette-hint', { keys: 'Ctrl+/' })}</p>
</Dialog>

<style>
  .query {
    width: 100%;
    height: 36px;
    padding: 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
    color: var(--ink);
    font-size: var(--text-lg);
  }
  .query:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--focus-ring);
  }
  .list {
    max-height: 360px;
    overflow-y: auto;
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 7px 10px;
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  li.active {
    background: var(--accent-soft);
  }
  .label {
    flex: 1;
    font-size: var(--text-md);
  }
  .none {
    color: var(--ink-3);
    cursor: default;
  }
  .hint {
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
</style>

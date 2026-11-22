<script lang="ts">
  /**
   * The top of Look (the plan of one form, stage 2): what the document is,
   * with the button that opens Document properties at its type; then one
   * line of what the document sets otherwise than its type, with what can be
   * done with that: put it into the type, where the type is the writer's
   * own; make a type of it; take it all away. While a type of the writer's
   * own is edited, that line is not shown: the panel says so over all its
   * parts, with Done. Under them, what the panel gives: the line of where
   * the changes hold.
   */
  import type { Snippet } from 'svelte';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';

  interface Props {
    /** The id of the document type, and its name. */
    type: string;
    typeName: string;
    /** How many changes the document has over its type. */
    count: number;
    /** Whether anything at all is set otherwise than the type: changes, or a look or a style chosen. */
    differs: boolean;
    /** Whether the type is the writer's own, and the application has it: what is set can be put into it. */
    own: boolean;
    /** Whether the type is being edited: every change goes into it, and the line of changes is not shown. */
    editing: boolean;
    /** Whether a type is being saved. */
    saving: boolean;
    ondocumenttype: () => void;
    onsaveto: () => void;
    onsaveas: (name: string) => void;
    onreset: () => void;
    children?: Snippet;
  }

  let {
    type,
    typeName,
    count,
    differs,
    own,
    editing,
    saving,
    ondocumenttype,
    onsaveto,
    onsaveas,
    onreset,
    children,
  }: Props = $props();

  /** The name of a new type, while it is asked for. */
  let naming = $state<string | null>(null);
</script>

<section class="whole" aria-label={t('look-whole')}>
  <div class="type-line" data-template={type}>
    <span class="name">{typeName}</span>
    <Button size="sm" data-document-type onclick={ondocumenttype}>{t('look-document-type')}</Button>
  </div>
  {#if !editing}
    <div class="state-line" data-changes={count}>
      {#if count}<span class="count">{t('look-changes-here', { count })}</span>{/if}
      {#if naming !== null}
        <form
          class="naming"
          onsubmit={(e) => {
            e.preventDefault();
            if (naming?.trim()) {
              onsaveas(naming);
              naming = null;
            }
          }}
        >
          <input
            bind:value={naming}
            aria-label={t('look-type-name')}
            placeholder={t('look-type-name')}
            class="type-name"
          />
          <Button type="submit" size="sm" variant="primary" disabled={saving || !naming.trim()}
            >{t('look-save')}</Button
          >
          <Button size="sm" variant="ghost" onclick={() => (naming = null)}
            >{t('common-cancel')}</Button
          >
        </form>
      {:else}
        <span class="buttons">
          {#if own}
            <Button size="sm" data-save-to disabled={!differs || saving} onclick={onsaveto}
              >{t('look-save-to', { name: typeName })}</Button
            >
          {/if}
          <Button
            size="sm"
            data-save-as
            disabled={saving}
            onclick={() => (naming = t('template-name-changed', { name: typeName }))}
            >{t('look-save-as')}</Button
          >
          {#if count}
            <Button size="sm" data-reset disabled={saving} onclick={onreset}
              >{t('look-reset')}</Button
            >
          {/if}
        </span>
      {/if}
    </div>
  {/if}
  {@render children?.()}
</section>

<style>
  /* What the document is, and what it sets otherwise, over the rest of the panel. */
  .whole {
    margin: 0 -16px 10px;
    padding: 8px 16px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  /* What the document is, by name, and the plain button that opens its type in Document properties. */
  .type-line {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .type-line .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--ink);
    font-family: var(--font-text);
    font-size: 16px;
  }
  .type-line :global(button) {
    flex: none;
  }
  .state-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    margin-top: 6px;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .count {
    flex: 1 0 100%;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .naming {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
  }
  .naming input {
    flex: 1;
    min-width: 140px;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    outline: none;
  }
  .naming input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
</style>

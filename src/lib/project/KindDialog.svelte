<script lang="ts">
  /**
   * A kind of element, made or changed: its name, its colour, and the text
   * an element of the kind begins with. A name is offered from the kinds
   * made before, in any project, with the colour it had then.
   */
  import { untrack } from 'svelte';
  import { t } from '$lib/i18n';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { KIND_COLOURS, nextKindColour } from './kinds';
  import { rememberKind } from './kinds.svelte';
  import type { Project } from './model/project.svelte';

  interface Props {
    project: Project;
    /** The kind that is changed; nothing for one that is made. */
    id: string | null;
    /** The elements a kind that is made is given to. */
    assign: string[];
    onclose: () => void;
  }

  let { project, id, assign, onclose }: Props = $props();

  // What the kind was when the dialog opened: the form starts from it.
  const existing = untrack(() => project.kind(id));
  let name = $state(existing?.name ?? '');
  let colour = $state(
    existing?.colour || untrack(() => nextKindColour(project.kinds.map((k) => k.colour))),
  );
  let template = $state(existing?.template ?? '');
  let field = $state<HTMLInputElement>();

  const uid = $props.id();
  /** The kinds made before that are not of this project already. */
  const known = $derived(
    settings.value.kinds.filter(
      (k) => !project.kinds.some((p) => p.name.toLocaleLowerCase() === k.name.toLocaleLowerCase()),
    ),
  );
  const taken = $derived(
    project.kinds.some(
      (k) => k.id !== id && k.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase(),
    ),
  );
  const howMany = $derived(
    id ? [...project.nodes.values()].filter((n) => n.kind === id).length : 0,
  );

  $effect(() => {
    field?.focus();
  });

  /** A name picked from those made before brings its colour. */
  function named() {
    const was = known.find((k) => k.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase());
    if (was && !existing) colour = was.colour;
  }

  function keep() {
    if (!name.trim() || taken) return;
    if (id) {
      project.updateKind(id, { name, colour, template });
    } else {
      const made = project.createKind({ name, colour, template });
      if (made && assign.length) {
        project.checkpoint();
        project.setKind(assign, made);
        project.checkpoint();
      }
    }
    rememberKind(name, colour);
    onclose();
  }

  async function remove() {
    if (!id) return;
    const sure = await confirm({
      title: t('kinds-delete-title', { name: existing?.name ?? '' }),
      message: t('kinds-delete-message', { count: howMany }),
      confirm: t('common-delete'),
      danger: true,
    });
    if (!sure) return;
    project.deleteKind(id);
    onclose();
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !(event.target instanceof HTMLTextAreaElement)) {
      event.preventDefault();
      keep();
    }
  }
</script>

<Dialog open title={id ? t('kinds-change') : t('kinds-new')} width={440} {onclose}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="form" {onkeydown}>
    <TextField
      bind:value={name}
      bind:el={field}
      label={t('kinds-name')}
      placeholder={t('kinds-name-placeholder')}
      list={known.length ? `kinds-known-${uid}` : undefined}
      error={taken ? t('kinds-name-taken') : null}
      autocomplete="off"
      spellcheck="false"
      onchange={named}
      oninput={named}
    />
    {#if known.length}
      <datalist id="kinds-known-{uid}">
        {#each known as k (k.name)}<option value={k.name}></option>{/each}
      </datalist>
    {/if}

    <div class="colours" role="radiogroup" aria-label={t('kinds-colour')}>
      <span class="label">{t('kinds-colour')}</span>
      <div class="swatches">
        {#each KIND_COLOURS as c (c.name)}
          <button
            type="button"
            role="radio"
            aria-checked={colour === c.name}
            aria-label={t(`kinds-colour-${c.name}`)}
            class="swatch"
            class:chosen={colour === c.name}
            style:--ink={c.ink}
            onclick={() => (colour = c.name)}
          ></button>
        {/each}
      </div>
    </div>

    <label class="template">
      <span class="label">{t('kinds-template')}</span>
      <textarea bind:value={template} rows="4" placeholder={t('kinds-template-placeholder')}
      ></textarea>
      <span class="hint">{t('kinds-template-hint')}</span>
    </label>
  </div>

  {#snippet footer()}
    {#if id}
      <Button variant="ghost" onclick={remove}>{t('common-delete')}</Button>
      <span class="gap"></span>
    {/if}
    <Button variant="ghost" onclick={onclose}>{t('common-cancel')}</Button>
    <Button variant="primary" disabled={!name.trim() || taken} onclick={keep}>
      {id ? t('common-save') : t('kinds-create')}
    </Button>
  {/snippet}
</Dialog>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .label {
    display: block;
    margin-bottom: 6px;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--ink-2);
  }
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .swatch {
    width: 24px;
    height: 24px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 50%;
    background: var(--ink);
    cursor: pointer;
    box-shadow: inset 0 0 0 2px var(--paper-raised);
  }
  .swatch.chosen {
    border-color: var(--ink);
  }
  .template textarea {
    display: block;
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--text-md);
    line-height: 1.4;
    resize: vertical;
  }
  .template textarea:focus {
    outline: none;
    border-color: var(--accent);
  }
  .hint {
    display: block;
    margin-top: 5px;
    font-size: var(--text-xs);
    color: var(--ink-4);
  }
  .gap {
    flex: 1;
  }
</style>

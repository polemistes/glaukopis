<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
  import { languageName, t, TEXT_LANGUAGES } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import type { DocumentSettings, Person } from '$lib/project/model/types';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';

  interface Props {
    project: Project;
    mapId: string;
    /** Limits of the format in use, shown beside what they limit. */
    limits?: { abstractWords: number | null; keywords: number | null };
    onclose: () => void;
  }

  let { project, mapId, limits, onclose }: Props = $props();

  const map = $derived(project.map(mapId));
  const root = $derived(map ? project.node(map.root) : undefined);

  // svelte-ignore state_referenced_locally
  let draft = $state<DocumentSettings>(
    structuredClone($state.snapshot(map?.document ?? {}) as DocumentSettings),
  );
  // svelte-ignore state_referenced_locally
  let keywords = $state((map?.document.keywords ?? []).join(', '));

  if (!draft.authors?.length) draft.authors = [{ name: '' }];

  const abstractWords = $derived((draft.abstract ?? '').match(/[\p{L}\p{N}]+/gu)?.length ?? 0);
  const keywordCount = $derived(keywords.split(/[,;\n]/).filter((k) => k.trim()).length);

  function save() {
    const authors = (draft.authors ?? [])
      .map((a): Person => ({
        name: a.name.trim(),
        affiliation: a.affiliation?.trim() || undefined,
        email: a.email?.trim() || undefined,
        orcid: a.orcid?.trim() || undefined,
      }))
      .filter((a) => a.name);
    project.checkpoint();
    project.setDocument(mapId, {
      title: draft.title?.trim(),
      subtitle: draft.subtitle?.trim(),
      authors,
      abstract: draft.abstract?.trim(),
      keywords: keywords
        .split(/[,;\n]/)
        .map((k) => k.trim())
        .filter(Boolean),
      date: draft.date?.trim(),
      language: draft.language?.trim(),
    });
    project.checkpoint();
    onclose();
  }

  // Named by the system, in the language of the interface.
  const languages: [string, string][] = $derived([
    ['', t('preview-details-language-none')],
    ...TEXT_LANGUAGES.map((tag): [string, string] => [tag, languageName(tag)]),
  ]);
</script>

<Dialog
  open
  title={t('preview-details-dialog')}
  subtitle={t('preview-details-dialog-subtitle')}
  width={600}
  {onclose}
>
  <div class="details">
    <label class="field">
      <span>{t('preview-details-title')}</span>
      <input
        bind:value={draft.title}
        class="serif"
        placeholder={root?.title || t('preview-details-title-placeholder')}
      />
      <small>{t('preview-details-title-hint')}</small>
    </label>
    <label class="field">
      <span>{t('preview-details-subtitle')}</span>
      <input bind:value={draft.subtitle} class="serif" />
    </label>

    <div class="field">
      <span>{t('preview-details-authors')}</span>
      {#each draft.authors ?? [] as author, i (i)}
        <div class="author">
          <input
            bind:value={author.name}
            placeholder={t('preview-details-name')}
            aria-label={t('preview-details-author-name', { number: i + 1 })}
          />
          <input
            bind:value={author.affiliation}
            placeholder={t('preview-details-affiliation')}
            aria-label={t('preview-details-author-affiliation', { number: i + 1 })}
          />
          <input
            bind:value={author.email}
            placeholder={t('preview-details-email')}
            aria-label={t('preview-details-author-email', { number: i + 1 })}
          />
          <IconButton
            label={t('common-remove')}
            size="sm"
            disabled={(draft.authors?.length ?? 0) <= 1 && !author.name}
            onclick={() => {
              draft.authors?.splice(i, 1);
              if (!draft.authors?.length) draft.authors = [{ name: '' }];
            }}
          >
            <X size={13} />
          </IconButton>
        </div>
      {/each}
      <button type="button" class="add" onclick={() => draft.authors?.push({ name: '' })}>
        <Plus size={12} />
        {t('preview-details-add-author')}
      </button>
    </div>

    <label class="field">
      <span>
        {t('preview-details-abstract')}
        <em class:over={!!limits?.abstractWords && abstractWords > limits.abstractWords}>
          {limits?.abstractWords
            ? t('preview-details-words-of', { count: abstractWords, limit: limits.abstractWords })
            : t('preview-details-words', { count: abstractWords })}
        </em>
      </span>
      <textarea bind:value={draft.abstract} rows="5" class="serif"></textarea>
    </label>

    <label class="field">
      <span>
        {t('preview-details-keywords')}
        {#if limits?.keywords}
          <em class:over={keywordCount > limits.keywords}
            >{t('preview-details-keywords-of', { count: keywordCount, limit: limits.keywords })}</em
          >
        {/if}
      </span>
      <input bind:value={keywords} placeholder={t('preview-details-keywords-placeholder')} />
    </label>

    <div class="pair">
      <label class="field">
        <span>{t('preview-details-date')}</span>
        <input bind:value={draft.date} placeholder={t('preview-details-date-placeholder')} />
      </label>
      <label class="field">
        <span>{t('preview-details-language')}</span>
        <select bind:value={draft.language}>
          {#each languages as [value, label] (value)}
            <option {value}>{label}</option>
          {/each}
          {#if draft.language && !languages.some(([v]) => v === draft.language)}
            <option value={draft.language}>{languageName(draft.language)}</option>
          {/if}
        </select>
      </label>
    </div>
  </div>

  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>{t('common-cancel')}</Button>
    <Button variant="primary" onclick={save}>{t('common-save')}</Button>
  {/snippet}
</Dialog>

<style>
  .details {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .field > span {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--ink-2);
  }
  em {
    font-style: normal;
    font-weight: 400;
    color: var(--ink-4);
  }
  em.over {
    color: var(--danger);
    font-weight: 500;
  }
  small {
    font-size: var(--text-xs);
    color: var(--ink-4);
  }
  input,
  textarea,
  select {
    width: 100%;
    min-height: var(--control-h);
    padding: 0 9px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    outline: none;
  }
  textarea {
    padding: 8px 10px;
    line-height: 1.5;
    resize: vertical;
  }
  .serif {
    font-family: var(--font-text);
    font-size: 14.5px;
  }
  :is(input, textarea, select):focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  input::placeholder {
    color: var(--ink-4);
    font-family: var(--font-ui);
    font-size: var(--text-md);
  }
  .author {
    display: grid;
    grid-template-columns: 1.2fr 1.3fr 1.1fr auto;
    gap: 5px;
    align-items: center;
  }
  .add {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    align-self: flex-start;
    padding: 2px 7px 2px 5px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .add:hover {
    background: var(--paper-hover);
    color: var(--accent-strong);
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
</style>

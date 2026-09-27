<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
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

  const languages: [string, string][] = [
    ['', 'Not stated (English)'],
    ['en-GB', 'English (British)'],
    ['en-US', 'English (American)'],
    ['nb', 'Norwegian (bokmål)'],
    ['nn', 'Norwegian (nynorsk)'],
    ['da', 'Danish'],
    ['sv', 'Swedish'],
    ['de', 'German'],
    ['fr', 'French'],
    ['it', 'Italian'],
    ['es', 'Spanish'],
    ['pt', 'Portuguese'],
    ['nl', 'Dutch'],
    ['el', 'Greek'],
    ['la', 'Latin'],
    ['fi', 'Finnish'],
    ['is', 'Icelandic'],
    ['pl', 'Polish'],
    ['cs', 'Czech'],
    ['ru', 'Russian'],
    ['tr', 'Turkish'],
  ];
</script>

<Dialog open title="The document" subtitle="What stands on its first page" width={600} {onclose}>
  <div class="details">
    <label class="field">
      <span>Title</span>
      <input
        bind:value={draft.title}
        class="serif"
        placeholder={root?.title || 'The name of the centre of the map'}
      />
      <small>Left empty, the name of the centre of the map is the title.</small>
    </label>
    <label class="field">
      <span>Subtitle</span>
      <input bind:value={draft.subtitle} class="serif" />
    </label>

    <div class="field">
      <span>Authors</span>
      {#each draft.authors ?? [] as author, i (i)}
        <div class="author">
          <input bind:value={author.name} placeholder="Name" aria-label="Name of author {i + 1}" />
          <input
            bind:value={author.affiliation}
            placeholder="Affiliation"
            aria-label="Affiliation of author {i + 1}"
          />
          <input
            bind:value={author.email}
            placeholder="E-mail"
            aria-label="E-mail of author {i + 1}"
          />
          <IconButton
            label="Remove"
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
        <Plus size={12} /> author
      </button>
    </div>

    <label class="field">
      <span>
        Abstract
        <em class:over={!!limits?.abstractWords && abstractWords > limits.abstractWords}>
          {abstractWords}{limits?.abstractWords ? ` of ${limits.abstractWords}` : ''} words
        </em>
      </span>
      <textarea bind:value={draft.abstract} rows="5" class="serif"></textarea>
    </label>

    <label class="field">
      <span>
        Keywords
        {#if limits?.keywords}
          <em class:over={keywordCount > limits.keywords}>{keywordCount} of {limits.keywords}</em>
        {/if}
      </span>
      <input bind:value={keywords} placeholder="Separated by commas" />
    </label>

    <div class="pair">
      <label class="field">
        <span>Date</span>
        <input bind:value={draft.date} placeholder="As it is to be printed" />
      </label>
      <label class="field">
        <span>Language of the text</span>
        <select bind:value={draft.language}>
          {#each languages as [value, label] (value)}
            <option {value}>{label}</option>
          {/each}
          {#if draft.language && !languages.some(([v]) => v === draft.language)}
            <option value={draft.language}>{draft.language}</option>
          {/if}
        </select>
      </label>
    </div>
  </div>

  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>Cancel</Button>
    <Button variant="primary" onclick={save}>Save</Button>
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

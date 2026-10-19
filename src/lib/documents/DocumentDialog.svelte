<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import { documentForget, documentRead, documentReadStop, type Imported } from '$lib/api/imported';
  import { isBackendError } from '$lib/api/backend';
  import { pictures } from '$lib/figures/pictures.svelte';
  import { citeAtOnceIn } from '$lib/found/atonce';
  import { languages, t } from '$lib/i18n';
  import { settings } from '$lib/state/settings.svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { makeImported, titleOf, type StyleChoice } from '$lib/project/model/import';
  import { PROJECT } from '$lib/project/model/types';
  import { openProject, projects } from '$lib/state/projects.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import { isReadPath, ocrForget, type Making } from '$lib/api/ocr';
  import MadeOf from '$lib/ocr/MadeOf.svelte';
  import ReadStep from '$lib/ocr/ReadStep.svelte';
  import Outline from '$lib/ocr/Outline.svelte';
  import StylesFound from '$lib/ocr/StylesFound.svelte';
  import { keepReferences, type Bringing, type Brought } from './bringing.svelte';

  let { request, onclose }: { request: Bringing; onclose: () => void } = $props();
  /** Whether the reading step shows the text the PDF has beside its choices: the dialog widens. */
  let wide = $state(false);

  // svelte-ignore state_referenced_locally
  const file = request.name ?? request.path.split(/[\\/]/).pop() ?? request.path;
  const ticket = newId();
  /** A PDF or a picture, whose text is read by Tesseract (`ocr/ReadStep.svelte`). */
  // svelte-ignore state_referenced_locally
  const scanned = isReadPath(request.path);

  let read = $state.raw<Imported | null>(null);
  let title = $state('');
  let failure = $state<string | null>(null);
  let making = $state(false);
  /** What each style found in a PDF whose shape was kept was said to be, by its number; text where nothing is said. */
  const styles = new SvelteMap<number, StyleChoice>();
  /** The dialog was left while the file was being read: what is read then is not wanted. */
  let left = false;
  /** The reading of a PDF, kept so that what is made of it can be made anew, and how many pages it has. */
  let kept = $state<string | null>(null);
  let pages = $state(0);
  let madeOf = $state<Making>({ shape: true, structure: 'headings', pageMarks: true });

  onDestroy(() => {
    if (kept)
      ocrForget(kept).catch((error) =>
        console.error('the reading kept could not be let go', error),
      );
  });

  onMount(() => {
    if (!scanned) void begin();
  });

  async function begin() {
    try {
      const imported = await documentRead(request.path, ticket, !!request.stored);
      if (left) {
        if (imported.pictures.length) await documentForget(imported.pictures).catch(() => {});
        return;
      }
      read = imported;
      title = titleOf(imported);
    } catch (error) {
      if (left) return;
      failure =
        isBackendError(error) && error.kind === 'missing-program'
          ? t('documents-no-pandoc')
          : (describeError(error) ?? t('documents-unread'));
    }
  }

  function done(brought: Brought | null) {
    request.resolve(brought);
    onclose();
  }

  async function cancel() {
    if (making) return;
    left = true;
    if (!read && !failure) documentReadStop(ticket).catch(() => {});
    // The pictures that were taken in for it are not kept.
    if (read?.pictures.length) await documentForget(read.pictures).catch(() => {});
    done(null);
  }

  /**
   * What was read, with citations where they are made at once: of those
   * Zotero made, of works the library has, if the writer has said so.
   */
  async function withCitations(imported: Imported): Promise<Imported> {
    if (!imported.counts.foundMade || !settings.value.found.atOnce) return imported;
    try {
      // Notes that hold a citation become citations as the writer has said for all, or as a note that is nothing else does.
      return (await citeAtOnceIn(imported, undefined, { inNotes: settings.value.found.inNotes }))
        .imported;
    } catch (error) {
      // They wait to be gone through, as the others do.
      console.error('the library could not be asked for what is cited', error);
      return imported;
    }
  }

  async function make() {
    if (!read || making) return;
    making = true;
    failure = null;
    try {
      // What is shown stays while the tree is made.
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (read.pictures.length) await pictures.reload();
      const text = await withCitations(read);
      // Those that are left are gone through when the tree is made, if the writer has said so.
      const goThrough = text.counts.found > 0 && settings.value.found.goThrough;
      if (request.project) {
        const made = makeImported(request.project, request.under, text, title, styles);
        if (!made) throw new Error(t('documents-failed'));
        await keepReferences(request.project, made.cited);
        done({ top: made.top, goThrough });
        return;
      }
      // A project of its own, named after the document, with the document as a tree under it.
      const name = title.replace(/\s+/g, ' ').trim() || titleOf(read) || t('documents-untitled');
      const info = await projects.create(name);
      const opened = await openProject(info.id);
      const made = makeImported(opened.project, PROJECT, text, title, styles);
      if (made) await keepReferences(opened.project, made.cited);
      await opened.project.close();
      if (!made) throw new Error(t('documents-failed'));
      done({ top: made.top, project: info, goThrough });
    } catch (error) {
      failure = describeError(error) ?? t('documents-failed');
      making = false;
    }
  }

  const facts = $derived.by(() => {
    if (!read) return [];
    const c = read.counts;
    const all: [string, string, number, boolean][] = [
      ['parts', t('documents-parts', { count: c.parts }), c.parts, true],
      ['words', t('documents-words', { count: c.words }), c.words, true],
      ['notes', t('documents-notes', { count: c.notes }), c.notes, false],
      ['figures', t('documents-figures', { count: c.figures }), c.figures, false],
      ['tables', t('documents-tables', { count: c.tables }), c.tables, false],
      ['equations', t('documents-equations', { count: c.equations }), c.equations, false],
    ];
    return all.filter(([, , n, always]) => always || n > 0);
  });

  const cited = $derived.by(() => {
    if (!read) return '';
    const { cited: found, notFound } = read.counts;
    if (found && notFound) return t('documents-cited-both', { cited: found, missing: notFound });
    if (found) return t('documents-cited-in-library', { cited: found });
    if (notFound) return t('documents-cited-not-in-library', { missing: notFound });
    return '';
  });

  /**
   * The citations that were found, in a line over what is to be done with
   * them. What they are is said once, among what there is to know.
   */
  const found = $derived.by(() => {
    if (!read?.counts.found) return '';
    const { found: all, foundMade: made } = read.counts;
    if (made === 0) return t('documents-found', { count: all });
    if (made === all) return t('documents-found-made', { count: all });
    return t('documents-found-some-made', { count: all, made });
  });
</script>

<Dialog
  open
  title={request.project ? t('documents-title-element') : t('documents-title-project')}
  subtitle={read ? `${read.file} · ${read.kind}` : file}
  width={wide && !read ? 960 : 560}
  dismissable={!making}
  onclose={cancel}
>
  {#if failure && !read}
    <p class="failure selectable" role="alert"><CircleAlert size={15} /> <span>{failure}</span></p>
  {:else if !read && scanned}
    <ReadStep
      path={request.path}
      stored={!!request.stored}
      name={request.name}
      bind:wide
      onread={(imported, token, count) => {
        read = imported;
        title = titleOf(imported);
        kept = token ?? null;
        pages = count ?? 0;
      }}
    />
  {:else if !read}
    <div class="reading" aria-live="polite">
      <Spinner size={18} />
      <div>
        <div class="doing">{t('documents-reading', { file })}</div>
        <div class="hint">{t('documents-reading-hint')}</div>
      </div>
    </div>
  {:else}
    <form
      onsubmit={(e) => {
        e.preventDefault();
        make();
      }}
    >
      <TextField
        bind:value={title}
        label={t('documents-title')}
        size="lg"
        serif
        hint={request.project
          ? t('documents-title-hint-element')
          : t('documents-title-hint-project')}
        data-autofocus
      />
    </form>

    <dl class="facts">
      {#each facts as [id, label, n] (id)}
        <div data-fact={id}>
          <dd>{n.toLocaleString(languages.current)}</dd>
          <dt>{label}</dt>
        </div>
      {/each}
    </dl>
    {#if cited}<p class="cited" data-fact="cited">{cited}</p>{/if}
    {#if kept && pages > 1}
      <MadeOf
        {kept}
        {pages}
        imported={read}
        bind:making={madeOf}
        disabled={making}
        onmade={(made) => (read = made)}
      />
    {/if}
    {#if read.structured}
      <Outline imported={read} {title} />
    {/if}
    {#if read.styles.length}
      <StylesFound styles={read.styles} choices={styles} disabled={making} />
    {/if}
    {#if found}
      <p class="cited" data-fact="found">{found}</p>
      <div class="choices">
        {#if read.counts.foundMade}
          <label class="check">
            <input
              type="checkbox"
              data-choice="at-once"
              checked={settings.value.found.atOnce}
              disabled={making}
              onchange={(e) => settings.setFound({ atOnce: e.currentTarget.checked })}
            />
            {t('documents-at-once')}
          </label>
          <p class="under">{t('documents-at-once-notes')}</p>
        {/if}
        <label class="check">
          <input
            type="checkbox"
            data-choice="go-through"
            checked={settings.value.found.goThrough}
            disabled={making}
            onchange={(e) => settings.setFound({ goThrough: e.currentTarget.checked })}
          />
          {request.project ? t('documents-go-through-element') : t('documents-go-through-project')}
        </label>
      </div>
    {/if}

    {#if read.remarks.length}
      <div class="overline">{t('documents-to-know')}</div>
      <ul class="remarks selectable">
        {#each read.remarks as remark}
          <li>{remark}</li>
        {/each}
      </ul>
    {/if}
    {#if failure}
      <p class="failure selectable" role="alert">
        <CircleAlert size={15} /> <span>{failure}</span>
      </p>
    {/if}
  {/if}

  {#snippet footer()}
    {#if making}
      <div class="working"><Spinner /> {t('documents-making')}</div>
    {/if}
    {#if failure && !read}
      <Button variant="primary" onclick={cancel}>{t('common-close')}</Button>
    {:else}
      <Button variant="ghost" disabled={making} onclick={cancel}>{t('common-cancel')}</Button>
      <Button variant="primary" disabled={!read || making || !title.trim()} onclick={make}>
        {request.project ? t('documents-make-element') : t('documents-make-project')}
      </Button>
    {/if}
  {/snippet}
</Dialog>

<style>
  .reading {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 96px;
  }
  .doing {
    font-weight: 550;
  }
  .hint {
    margin-top: 2px;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .failure {
    display: flex;
    gap: 8px;
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    line-height: 1.45;
  }
  .failure :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .failure span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 26px;
    margin: var(--space-4) 0 0;
  }
  .facts div {
    display: flex;
    flex-direction: column;
  }
  .facts dd {
    margin: 0;
    font-family: var(--font-text);
    font-size: 21px;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }
  .facts dt {
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .cited {
    margin: var(--space-3) 0 0;
    color: var(--ink-2);
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: var(--space-2);
  }
  .check {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--ink-2);
    cursor: pointer;
  }
  /* What follows from a choice, under it, as far in as its words. */
  .under {
    margin: -6px 0 0 23px;
    font-size: var(--text-sm);
    line-height: 1.4;
    color: var(--ink-3);
  }
  .check input {
    accent-color: var(--accent);
    margin: 0;
  }
  .overline {
    margin-top: var(--space-4);
  }
  .remarks {
    max-height: 190px;
    overflow-y: auto;
    margin: 6px 0 0;
    padding-left: 18px;
    font-size: var(--text-sm);
    color: var(--ink-2);
    line-height: 1.5;
  }
  .remarks li + li {
    margin-top: 4px;
  }
  .remarks + .failure {
    margin-top: var(--space-3);
  }
  .working {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: auto;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
</style>

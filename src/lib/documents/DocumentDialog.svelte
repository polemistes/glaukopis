<script lang="ts">
  import { onMount } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import { documentForget, documentRead, documentReadStop, type Imported } from '$lib/api/imported';
  import { isBackendError } from '$lib/api/backend';
  import { pictures } from '$lib/figures/pictures.svelte';
  import { citeAtOnceIn } from '$lib/found/atonce';
  import { settings } from '$lib/state/settings.svelte';
  import { makeMap, titleOf } from '$lib/project/model/import';
  import { openProject, projects } from '$lib/state/projects.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import { keepReferences, type Bringing, type Brought } from './bringing.svelte';

  let { request, onclose }: { request: Bringing; onclose: () => void } = $props();

  // svelte-ignore state_referenced_locally
  const file = request.path.split(/[\\/]/).pop() ?? request.path;
  const ticket = newId();

  let read = $state.raw<Imported | null>(null);
  let title = $state('');
  let failure = $state<string | null>(null);
  let making = $state(false);
  /** The dialog was left while the file was being read: what is read then is not wanted. */
  let left = false;

  onMount(() => {
    void begin();
  });

  async function begin() {
    try {
      const imported = await documentRead(request.path, ticket);
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
          ? 'Documents of this kind are read by Pandoc, which is not installed or could not be found. Where it is can be said in the settings.'
          : (describeError(error) ?? 'The file could not be read.');
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
      return (await citeAtOnceIn(imported)).imported;
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
      // What is shown stays while the map is made.
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (read.pictures.length) await pictures.reload();
      const text = await withCitations(read);
      // Those that are left are gone through when the map is made, if the writer has said so.
      const goThrough = text.counts.found > 0 && settings.value.found.goThrough;
      if (request.project) {
        const made = makeMap(request.project, text, title);
        await keepReferences(request.project, made.cited);
        done({ map: made.map, goThrough });
        return;
      }
      // A project of its own, named after the document, with the map in it.
      const name = title.replace(/\s+/g, ' ').trim() || titleOf(read) || 'Untitled';
      const info = await projects.create(name);
      const opened = await openProject(info.id);
      const first = opened.project.maps.map((m) => m.id);
      const made = makeMap(opened.project, text, title);
      // The map a project begins with gives way to that of the document.
      for (const id of first) opened.project.deleteMap(id);
      await keepReferences(opened.project, made.cited);
      await opened.project.close();
      done({ map: made.map, project: info, goThrough });
    } catch (error) {
      failure = describeError(error) ?? 'The map could not be made.';
      making = false;
    }
  }

  const facts = $derived.by(() => {
    if (!read) return [];
    const c = read.counts;
    const all: [string, string, number, boolean][] = [
      ['parts', c.parts === 1 ? 'Part' : 'Parts', c.parts, true],
      ['words', c.words === 1 ? 'Word' : 'Words', c.words, true],
      ['notes', c.notes === 1 ? 'Note' : 'Notes', c.notes, false],
      ['figures', c.figures === 1 ? 'Figure' : 'Figures', c.figures, false],
      ['tables', c.tables === 1 ? 'Table' : 'Tables', c.tables, false],
      ['equations', c.equations === 1 ? 'Equation' : 'Equations', c.equations, false],
    ];
    return all.filter(([, , n, always]) => always || n > 0);
  });

  const cited = $derived.by(() => {
    if (!read) return '';
    const { cited: found, notFound } = read.counts;
    if (!found && !notFound) return '';
    const times = (n: number) =>
      n === 1 ? 'once' : n === 2 ? 'twice' : `${n.toLocaleString()} times`;
    const parts: string[] = [];
    if (found) parts.push(`Works of your library are cited ${times(found)}`);
    if (notFound)
      parts.push(
        found
          ? `works that are not in it ${times(notFound)}`
          : `Works that are not in your library are cited ${times(notFound)}`,
      );
    return `${parts.join(', ')}.`;
  });

  /**
   * The citations that were found, in a line over what is to be done with
   * them. What they are is said once, among what there is to know.
   */
  const found = $derived.by(() => {
    if (!read?.counts.found) return '';
    const { found: all, foundMade: made } = read.counts;
    const by =
      made === 0
        ? ''
        : made === all
          ? all === 1
            ? ', made by a program that keeps references'
            : ', all made by a program that keeps references'
          : `, ${made.toLocaleString()} of them made by a program that keeps references`;
    return `${all === 1 ? 'One citation was' : `${all.toLocaleString()} citations were`} found${by}.`;
  });
</script>

<Dialog
  open
  title={request.project ? 'A map from a document' : 'A project from a document'}
  subtitle={read ? `${read.file} · ${read.kind}` : file}
  width={560}
  dismissable={!making}
  onclose={cancel}
>
  {#if failure && !read}
    <p class="failure selectable" role="alert"><CircleAlert size={15} /> <span>{failure}</span></p>
  {:else if !read}
    <div class="reading" aria-live="polite">
      <Spinner size={18} />
      <div>
        <div class="doing">Reading {file}…</div>
        <div class="hint">A long document takes a moment.</div>
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
        label="Title"
        size="lg"
        serif
        hint={request.project
          ? 'The name of the map, and of the element at its centre.'
          : 'The name of the project, of its map, and of the element at the centre of the map.'}
        data-autofocus
      />
    </form>

    <dl class="facts">
      {#each facts as [id, label, n] (id)}
        <div data-fact={id}>
          <dd>{n.toLocaleString()}</dd>
          <dt>{label}</dt>
        </div>
      {/each}
    </dl>
    {#if cited}<p class="cited" data-fact="cited">{cited}</p>{/if}
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
            Make citations at once of those made by Zotero of works your library has
          </label>
        {/if}
        <label class="check">
          <input
            type="checkbox"
            data-choice="go-through"
            checked={settings.value.found.goThrough}
            disabled={making}
            onchange={(e) => settings.setFound({ goThrough: e.currentTarget.checked })}
          />
          Go through the citations when the {request.project ? 'map' : 'project'} is made
        </label>
      </div>
    {/if}

    {#if read.remarks.length}
      <div class="overline">To know</div>
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
      <div class="working"><Spinner /> Making the map…</div>
    {/if}
    {#if failure && !read}
      <Button variant="primary" onclick={cancel}>Close</Button>
    {:else}
      <Button variant="ghost" disabled={making} onclick={cancel}>Cancel</Button>
      <Button variant="primary" disabled={!read || making || !title.trim()} onclick={make}>
        {request.project ? 'Make the map' : 'Make the project'}
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

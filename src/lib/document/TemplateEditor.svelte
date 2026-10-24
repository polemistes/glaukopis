<script lang="ts">
  /**
   * The editor of a template (ADR 0038), after the editor of a layout: its
   * name and description, the layout and reference style it brings, the
   * order of its contents, the kinds of elements and of passages it puts in
   * hand, what it requires, and the files it makes. Editing one that came
   * with the application makes one of the writer's own.
   */
  import { untrack } from 'svelte';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
  import { openPath } from '$lib/api/documents';
  import {
    templatesDelete,
    templatesSave,
    type ContentsItem,
    type Output,
    type OutputTarget,
    type Template,
  } from '$lib/api/templates';
  import { CATALOGUE, GROUPS } from '$lib/editor/kinds';
  import { t } from '$lib/i18n';
  import { formatGroups, styleGroups } from '$lib/look/choosing.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import Settings from '$lib/ui/settings/Settings.svelte';
  import { rowsOf, type Row } from '$lib/ui/settings/rows';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import { documents } from '$lib/preview/documents.svelte';
  import { PARTS as PART_CATALOGUE } from '$lib/project/parts';
  import {
    asOwn,
    confidenceWords,
    GENERATED_PARTS,
    generatedPartWords,
    PART_GROUPS,
    partGroupWords,
    TARGETS,
    targetWords,
    templateGroupWords,
  } from './templates';

  interface Props {
    /** The template to begin from. */
    id: string;
    /** A new template is made from it, rather than this one changed. */
    fresh?: boolean;
    /** The project's copy of the template, to begin from where the application lacks it. */
    copy?: Template;
    /** Called with the id of the template as saved. */
    onsaved: (id: string) => void;
    onclose: () => void;
  }

  let { id, fresh = false, copy, onsaved, onclose }: Props = $props();

  let template = $state<Template | null>(null);
  let original = '';
  let name = $state('');
  let section = $state('about');
  let error = $state<string | null>(null);
  let saving = $state(false);

  /** Whether what is edited is the writer's own, and saved under its own id. */
  const own = $derived(!!template && template.group === 'own' && !fresh);
  const changed = $derived(!!template && JSON.stringify($state.snapshot(template)) !== original);

  $effect(() => {
    const wanted = id;
    untrack(async () => {
      try {
        const loaded = structuredClone(
          $state.snapshot(copy ?? (await documents.templateOf(wanted))),
        ) as Template;
        original = JSON.stringify(loaded);
        template = loaded;
        name = fresh
          ? t('template-name-own', { name: loaded.name })
          : loaded.group === 'own'
            ? loaded.name
            : t('template-name-changed', { name: loaded.name });
      } catch (e) {
        error = describeError(e) ?? t('template-read-failed');
      }
    });
  });

  async function save() {
    if (!template || saving) return;
    saving = true;
    error = null;
    try {
      const snapshot = $state.snapshot(template) as Template;
      const taken = documents.templates.map((s) => s.id);
      const toSave = own
        ? { ...snapshot, name: name.trim() || snapshot.name }
        : asOwn(snapshot, name, taken, fresh);
      const saved = await templatesSave(toSave);
      documents.forgetTemplate(saved.id);
      await documents.reload();
      notifyOk(t('template-saved', { name: saved.name }));
      onsaved(saved.id);
    } catch (e) {
      error = describeError(e) ?? t('template-save-failed');
    } finally {
      saving = false;
    }
  }

  async function remove() {
    if (!template || !own) return;
    const ok = await confirm({
      title: t('template-delete-title', { name: template.name }),
      message: t('template-delete-message'),
      confirm: t('template-delete-confirm'),
      danger: true,
    });
    if (!ok) return;
    try {
      await templatesDelete(template.id);
      documents.forgetTemplate(template.id);
      await documents.reload();
      onsaved(template.basedOn ?? 'plain');
    } catch (e) {
      error = describeError(e) ?? t('template-delete-failed');
    }
  }

  async function close() {
    if (changed) {
      const ok = await confirm({
        title: t('template-leave-title'),
        message: t('template-leave-message'),
        confirm: t('template-leave-confirm'),
        cancel: t('template-leave-cancel'),
      });
      if (!ok) return;
    }
    onclose();
  }

  const sections: [string, string][] = $derived([
    ['about', t('template-section-about')],
    ['looks', t('template-section-looks')],
    ['contents', t('template-section-contents')],
    ['kinds', t('template-section-kinds')],
    ['passage-kinds', t('template-section-passage-kinds')],
    ['requirements', t('template-section-requirements')],
    ['outputs', t('template-section-outputs')],
  ]);

  // ---- the layout and the style ----

  const layoutGroups = $derived(formatGroups());
  const styleGroupsOffered = $derived(styleGroups());

  // ---- the contents ----

  const partLabel = (kindId: string) =>
    PART_CATALOGUE.find((k) => k.id === kindId)?.label() ?? kindId;
  function itemWords(item: ContentsItem): string {
    return 'part' in item
      ? generatedPartWords(item.part)
      : t('template-contents-kind', { name: partLabel(item.kind) });
  }
  const inContents = (item: ContentsItem) =>
    !!template?.contents.some((c) =>
      'part' in item ? 'part' in c && c.part === item.part : 'kind' in c && c.kind === item.kind,
    );

  function moveItem(i: number, by: -1 | 1) {
    if (!template) return;
    const list = template.contents;
    const j = i + by;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
  }

  function addPartMenu(event: MouseEvent) {
    const items: MenuItem[] = GENERATED_PARTS.map((part) => ({
      label: generatedPartWords(part),
      disabled: inContents({ part }),
      action: () => template?.contents.push({ part }),
    }));
    openMenu(event.currentTarget as HTMLElement, items, { align: 'start' });
  }

  function addKindMenu(event: MouseEvent) {
    const items: MenuItem[] = [];
    for (const group of PART_GROUPS) {
      items.push({ kind: 'heading', label: partGroupWords(group) });
      for (const kind of PART_CATALOGUE.filter((k) => k.group === group)) {
        items.push({
          label: kind.label(),
          disabled: inContents({ kind: kind.id }),
          action: () => template?.contents.push({ kind: kind.id }),
        });
      }
    }
    openMenu(event.currentTarget as HTMLElement, items, { align: 'start' });
  }

  // ---- the kinds in hand ----

  const kindGroups = $derived(
    PART_GROUPS.map((group) => ({
      group,
      label: partGroupWords(group),
      kinds: PART_CATALOGUE.filter((k) => k.group === group),
    })),
  );
  const inHand = (kindId: string) =>
    !!template && (template.kinds.includes(kindId) || inContents({ kind: kindId }));
  function setInHand(kindId: string, yes: boolean) {
    if (!template) return;
    const list = template.kinds.filter((k) => k !== kindId);
    template.kinds = yes ? [...list, kindId] : list;
  }

  const passageGroups = $derived(
    GROUPS.map((g) => ({
      id: g.id,
      label: g.label(),
      kinds: CATALOGUE.filter((k) => g.kinds.includes(k.id)),
    })).filter((g) => g.kinds.length),
  );
  function setPassageKind(kindId: string, yes: boolean) {
    if (!template) return;
    const list = template.passageKinds.filter((k) => k !== kindId);
    template.passageKinds = yes ? [...list, kindId] : list;
  }

  // ---- the requirements ----

  type T = Template;
  const { toggle, number } = rowsOf<T>();
  const counted = (most: number, step: number) => ({
    max: most,
    step,
    zero: t('template-no-limit'),
    nullable: true,
  });
  const requirementRows: Row<T>[] = $derived([
    { heading: t('template-section-requirements') },
    { note: t('template-requirements-hint') },
    number(t('template-requirement-words'), 'requirements.words', counted(1000000, 500)),
    number(
      t('template-requirement-abstract-words'),
      'requirements.abstractWords',
      counted(5000, 10),
    ),
    number(t('template-requirement-keywords'), 'requirements.keywords', counted(50, 1)),
    toggle(t('template-requirement-anonymity'), 'requirements.anonymous'),
  ]);

  // ---- the outputs ----

  const documentOutput = $derived(template?.outputs.find((o) => o.id === 'document') ?? null);
  const otherOutputs = $derived<Output[]>(
    template?.outputs.filter((o) => o.id !== 'document') ?? [],
  );
  function setTarget(target: OutputTarget, yes: boolean) {
    if (!template) return;
    let output = template.outputs.find((o) => o.id === 'document');
    if (!output) {
      output = { id: 'document', targets: [] };
      template.outputs.push(output);
    }
    const list = output.targets.filter((x) => x !== target);
    output.targets = yes ? TARGETS.filter((x) => x === target || list.includes(x)) : list;
  }
</script>

<Dialog
  open
  title={t('template-editor')}
  width={900}
  tall
  padded={false}
  dismissable={false}
  onclose={close}
>
  {#snippet header()}
    <div class="head">
      <h2>{t('template-editor')}</h2>
      <input
        class="name"
        bind:value={name}
        aria-label={t('template-name')}
        placeholder={t('template-name')}
      />
    </div>
  {/snippet}

  {#if !template}
    <div class="centre">
      {#if error}<p class="error">{error}</p>{:else}<Spinner size={22} />{/if}
    </div>
  {:else}
    {@const tp = template}
    <div class="editor">
      <nav aria-label={t('template-sections')}>
        {#each sections as [key, words] (key)}
          <button type="button" class:current={section === key} onclick={() => (section = key)}
            >{words}</button
          >
        {/each}
      </nav>

      <div class="form settings">
        {#if error}<p class="error selectable" role="alert">{error}</p>{/if}

        {#if section === 'about'}
          <h3>{t('template-section-about')}</h3>
          <label class="row tall">
            <span class="what">{t('template-description')}</span>
            <textarea rows="3" bind:value={tp.description}></textarea>
          </label>
          <div class="row">
            <span class="what">{t('template-group')}</span>
            <span class="said">{templateGroupWords('own')}</span>
          </div>
          <div class="row">
            <span class="what">{t('template-based-on')}</span>
            <span class="said">
              {#if own && tp.basedOn}
                {documents.templateSummary(tp.basedOn)?.name ?? tp.basedOn}
              {:else if !own}
                {tp.name}
              {:else}
                {t('template-based-on-none')}
              {/if}
            </span>
          </div>
          {#if tp.source?.name}
            {@const s = tp.source}
            <div class="source selectable">
              <p class="overline">{t('format-source')}</p>
              <p class="serif">{s.name}</p>
              {#if s.url}
                <button
                  type="button"
                  class="link"
                  onclick={() =>
                    openPath(s.url).catch((e) => notifyError(t('common-link-open-failed'), e))}
                >
                  {s.url}
                  <ExternalLink size={11} />
                </button>
              {/if}
              <p class="read">
                {#if s.checked}{t('format-source-read', { date: s.checked })}{/if}
                {confidenceWords(s.confidence)}
              </p>
              {#if s.notes}<p class="notes">{s.notes}</p>{/if}
              {#if own}<p class="notes">{t('template-source-changed')}</p>{/if}
            </div>
          {:else}
            <p class="hint top">{t('template-source-none')}</p>
          {/if}
        {:else if section === 'looks'}
          <h3>{t('template-section-looks')}</h3>
          <label class="row">
            <span class="what"
              >{t('template-layout')}<small>{t('template-layout-hint')}</small></span
            >
            <select
              value={tp.layout ?? ''}
              onchange={(e) => (tp.layout = e.currentTarget.value || undefined)}
            >
              <option value="">{t('template-usual')}</option>
              {#each layoutGroups as group (group.name)}
                <optgroup label={group.name}>
                  {#each group.formats as f (f.id)}
                    <option value={f.id}>{f.name}</option>
                  {/each}
                </optgroup>
              {/each}
              {#if tp.layout && !documents.formatSummary(tp.layout)}
                <option value={tp.layout}>{tp.layout}</option>
              {/if}
            </select>
          </label>
          <label class="row">
            <span class="what">{t('template-style')}<small>{t('template-style-hint')}</small></span>
            <select
              value={tp.style ?? ''}
              onchange={(e) => (tp.style = e.currentTarget.value || undefined)}
            >
              <option value="">{t('template-usual')}</option>
              {#each styleGroupsOffered as [group, styles] (group)}
                <optgroup label={group}>
                  {#each styles as s (s.id)}
                    <option value={s.id}>{s.title}</option>
                  {/each}
                </optgroup>
              {/each}
              {#if tp.style && !documents.style(tp.style)}
                <option value={tp.style}>{tp.style}</option>
              {/if}
            </select>
          </label>
        {:else if section === 'contents'}
          <h3>{t('template-section-contents')}</h3>
          <p class="hint top">{t('template-contents-hint')}</p>
          <ol class="contents">
            {#each tp.contents as item, i (i)}
              <li class:kind={'kind' in item}>
                <span class="item">{itemWords(item)}</span>
                <IconButton
                  label={t('template-contents-up')}
                  size="sm"
                  disabled={i === 0}
                  onclick={() => moveItem(i, -1)}
                >
                  <ChevronUp size={14} />
                </IconButton>
                <IconButton
                  label={t('template-contents-down')}
                  size="sm"
                  disabled={i === tp.contents.length - 1}
                  onclick={() => moveItem(i, 1)}
                >
                  <ChevronDown size={14} />
                </IconButton>
                <IconButton
                  label={t('common-remove')}
                  size="sm"
                  onclick={() => tp.contents.splice(i, 1)}
                >
                  <X size={14} />
                </IconButton>
              </li>
            {/each}
          </ol>
          <div class="adds">
            <Button size="sm" onclick={addPartMenu}>
              {#snippet icon()}<Plus size={13} />{/snippet}
              {t('template-contents-add-part')}
            </Button>
            <Button size="sm" onclick={addKindMenu}>
              {#snippet icon()}<Plus size={13} />{/snippet}
              {t('template-contents-add-kind')}
            </Button>
          </div>
        {:else if section === 'kinds'}
          <h3>{t('template-section-kinds')}</h3>
          <p class="hint top">{t('template-kinds-hint')}</p>
          {#each kindGroups as group (group.group)}
            <h4>{group.label}</h4>
            {#each group.kinds as kind (kind.id)}
              {@const listed = inContents({ kind: kind.id })}
              <label class="row check">
                <span class="what"
                  >{kind.label()}{#if listed}<small>{t('template-kinds-in-contents')}</small
                    >{/if}</span
                >
                <input
                  type="checkbox"
                  checked={inHand(kind.id)}
                  disabled={listed}
                  onchange={(e) => setInHand(kind.id, e.currentTarget.checked)}
                />
              </label>
            {/each}
          {/each}
        {:else if section === 'passage-kinds'}
          <h3>{t('template-section-passage-kinds')}</h3>
          <p class="hint top">{t('template-passage-kinds-hint')}</p>
          {#each passageGroups as group (group.id)}
            <h4>{group.label}</h4>
            {#each group.kinds as spec (spec.id)}
              <label class="row check">
                <span class="what">{spec.label()}<small>{spec.hint()}</small></span>
                <input
                  type="checkbox"
                  checked={tp.passageKinds.includes(spec.id)}
                  onchange={(e) => setPassageKind(spec.id, e.currentTarget.checked)}
                />
              </label>
            {/each}
          {/each}
        {:else if section === 'requirements'}
          <Settings target={tp} rows={requirementRows} />
          <label class="row tall">
            <span class="what">{t('template-requirement-note')}</span>
            <textarea
              rows="3"
              bind:value={tp.requirements.note}
              placeholder={t('template-requirement-note-placeholder')}></textarea>
          </label>
        {:else if section === 'outputs'}
          <h3>{t('template-section-outputs')}</h3>
          <p class="hint top">{t('template-outputs-hint')}</p>
          <h4>{t('template-output-document')}</h4>
          {#each TARGETS as target (target)}
            <label class="row check">
              <span class="what">{targetWords(target)}</span>
              <input
                type="checkbox"
                checked={documentOutput?.targets.includes(target) ?? false}
                onchange={(e) => setTarget(target, e.currentTarget.checked)}
              />
            </label>
          {/each}
          {#each otherOutputs as output (output.id)}
            <h4>
              {output.id === 'cover' ? t('template-output-cover') : (output.name ?? output.id)}
            </h4>
            <div class="row">
              <span class="what">{output.targets.map(targetWords).join(', ')}</span>
            </div>
            <p class="hint">{t('template-output-cover-note')}</p>
          {/each}
        {/if}
      </div>
    </div>
  {/if}

  {#snippet footer()}
    {#if own}
      <div class="left">
        <Button variant="danger" onclick={remove}>{t('template-delete')}</Button>
      </div>
    {:else}
      <div class="left note">{t('template-bundled')}</div>
    {/if}
    <Button variant="ghost" onclick={close}>{t('common-cancel')}</Button>
    <Button
      variant="primary"
      disabled={saving || !template || !name.trim() || (own && !changed && name === template.name)}
      onclick={save}
    >
      {own ? t('common-save') : t('template-save-own')}
    </Button>
  {/snippet}
</Dialog>

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .head h2 {
    flex: none;
    font-family: var(--font-text);
    font-size: var(--text-xl);
    font-weight: 600;
  }
  .name {
    flex: 1;
    max-width: 420px;
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    font-family: var(--font-text);
    font-size: 15px;
    outline: none;
  }
  .name:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .centre {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
  }
  .editor {
    display: grid;
    grid-template-columns: 210px minmax(360px, 1fr);
    height: 100%;
    min-height: 0;
    border-top: 1px solid var(--line);
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 12px 8px;
    background: var(--paper-sunken);
    border-right: 1px solid var(--line);
    overflow-y: auto;
  }
  nav button {
    min-height: 30px;
    padding: 5px 12px;
    line-height: 1.3;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    text-align: left;
    cursor: pointer;
  }
  nav button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  nav button.current {
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-weight: 500;
  }
  .form {
    padding: 18px 24px 28px;
    overflow-y: auto;
    min-width: 0;
  }
  .said {
    justify-self: end;
    color: var(--ink-2);
    text-align: right;
  }
  .source {
    margin-top: 16px;
    padding: 14px 16px;
    border-radius: var(--radius-m);
    background: var(--paper-sunken);
    line-height: 1.5;
  }
  .source .serif {
    margin-top: 2px;
    font-size: 15px;
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--accent-strong);
    font-size: var(--text-sm);
    text-align: left;
    overflow-wrap: anywhere;
    cursor: pointer;
  }
  .link:hover {
    text-decoration: underline;
  }
  .read {
    margin-top: 8px;
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .notes {
    margin-top: 8px;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .contents {
    margin: 0;
    padding: 0 0 0 26px;
  }
  .contents li {
    display: flex;
    align-items: center;
    gap: 2px;
    min-height: 34px;
    padding: 2px 0 2px 4px;
    border-bottom: 1px solid var(--line);
  }
  .contents .item {
    flex: 1;
    min-width: 0;
  }
  .contents li.kind .item {
    color: var(--accent-strong);
  }
  .adds {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  .error {
    padding: 8px 12px;
    margin-bottom: 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    white-space: pre-wrap;
  }
  .left {
    margin-right: auto;
  }
  .note {
    max-width: 52ch;
    font-size: var(--text-sm);
    color: var(--ink-3);
    line-height: 1.4;
  }
</style>

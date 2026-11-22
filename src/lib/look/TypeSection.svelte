<script lang="ts">
  /**
   * The last part of Look, Document type (the plan of one form, stage 2):
   * where the look of the document is taken from, named with where it is
   * from and never called a layout; and what the document changes, each
   * with where it was made and Reset. Then, for a type of the writer's own,
   * what the type is beside its look and its parts: its name and
   * description, the kinds of paragraph and of words it offers first, the
   * kinds of file it is exported as, and a way to delete it; each change
   * saved to the type at once. Only the body of the part: its heading and
   * its place are Look's.
   */
  import {
    templatesDelete,
    templatesSave,
    type OutputTarget,
    type Template,
  } from '$lib/api/templates';
  import { LIMITS, type Limit } from '$lib/document/composition';
  import { TARGETS, targetWords } from '$lib/document/templates';
  import { CATALOGUE, GROUPS } from '$lib/editor/kinds';
  import { t } from '$lib/i18n';
  import { documents, templateName } from '$lib/preview/documents.svelte';
  import type { Project } from '$lib/project/model/project.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { formatGroups, layoutName } from './choosing.svelte';
  import { Composition } from './composition.svelte';

  /** A change of the look, by the words of its row, and the element that makes it. */
  interface LookChange {
    path: string;
    words: string;
    who: string;
  }

  interface Props {
    project: Project;
    /** The element whose document it is. */
    at: string;
    /** The element whose look the panel sets: the document's, or one under it. */
    target: string;
    /** The type of the document, whole; nothing until it has been read. */
    template: Template | null;
    /** The changes of the look the panel shows. */
    changes: LookChange[];
    /** Takes a change of the look away from the element that makes it. */
    onreset: (who: string, path: string) => void;
    /** Sets where the look is taken from, on the element; nothing for the first choice. */
    onchoose: (format: string | undefined) => void;
  }

  let { project, at, target, template, changes, onreset, onchoose }: Props = $props();

  /** Whether the type is the writer's own, and the application has it: then it is changed here. */
  const ownType = $derived(
    !!template && template.group === 'own' && !!documents.templateSummary(template.id)?.own,
  );
  let error = $state<string | null>(null);

  /** Saves the type with a change, and keeps the project's copy of it. */
  async function change(patch: Partial<Template>) {
    if (!template || !ownType) return;
    error = null;
    try {
      const saved = await templatesSave({
        ...(JSON.parse(JSON.stringify(template)) as Template),
        ...patch,
      });
      documents.forgetTemplate(saved.id);
      await documents.reload();
      project.keepTemplate(saved);
    } catch (e) {
      error = describeError(e) ?? t('template-save-failed');
    }
  }

  function rename(name: string) {
    const clean = name.replace(/\s+/g, ' ').trim();
    if (clean && clean !== template?.name) void change({ name: clean });
  }

  /** The kinds of paragraph and of words of the catalogue, by their groups. */
  const passageGroups = $derived(
    GROUPS.map((g) => ({
      id: g.id,
      label: g.label(),
      kinds: CATALOGUE.filter((k) => g.kinds.includes(k.id)),
    })).filter((g) => g.kinds.length),
  );
  function offerKind(kind: string, yes: boolean) {
    if (!template) return;
    const list = template.passageKinds.filter((k) => k !== kind);
    void change({ passageKinds: yes ? [...list, kind] : list });
  }

  /** The kinds of file the document itself is exported as. */
  const targets = $derived(template?.outputs.find((o) => o.id === 'document')?.targets ?? []);
  function exportAs(target: OutputTarget, yes: boolean) {
    if (!template) return;
    const outputs = JSON.parse(JSON.stringify(template.outputs)) as Template['outputs'];
    let output = outputs.find((o) => o.id === 'document');
    if (!output) {
      output = { id: 'document', targets: [] };
      outputs.push(output);
    }
    const list = output.targets.filter((x) => x !== target);
    output.targets = yes ? TARGETS.filter((x) => x === target || list.includes(x)) : list;
    void change({ outputs });
  }

  /**
   * Deletes the type, after asking: the elements that chose it choose what
   * it was made from, in one step of undo, and the project lets its copy go.
   */
  async function remove() {
    if (!template || !ownType) return;
    const gone = template;
    const ok = await confirm({
      title: t('template-delete-title', { name: gone.name }),
      message: t('template-delete-message'),
      confirm: t('template-delete-confirm'),
      danger: true,
    });
    if (!ok) return;
    error = null;
    try {
      await templatesDelete(gone.id);
      documents.forgetTemplate(gone.id);
      await documents.reload();
      const users = [...project.nodes.values()]
        .filter((n) => n.document.template === gone.id)
        .map((n) => n.id);
      project.checkpoint();
      project.transact(() => {
        for (const id of users) project.setDocument(id, { template: gone.basedOn ?? 'plain' });
      });
      project.checkpoint();
      project.dropTemplate(gone.id);
    } catch (e) {
      error = describeError(e) ?? t('template-delete-failed');
    }
  }

  const nameOf = (id: string) => project.node(id)?.title || t('project-untitled');
  const own = $derived(project.node(target)?.document ?? {});
  const inherited = $derived(project.documentOf(target));
  const choice = $derived(documents.choice(inherited.settings, project));
  const typeName = $derived(templateName(project, choice.template));
  const nameOfLayout = $derived(layoutName(choice.format));

  /** The element over this one the look is taken from, by name; nothing where it is this one's, or nobody's. */
  const chosenAbove = $derived.by(() => {
    if (own.format) return null;
    const who = inherited.from.get('format');
    return who && who !== target ? nameOf(who) : null;
  });
  /** The first choice: the look the type brings, or the writer's default, or what an element over this one chose. */
  const first = $derived(
    chosenAbove
      ? t('look-from-with', { name: chosenAbove, what: nameOfLayout })
      : template?.layout
        ? t('look-from-type', { name: layoutName(template.layout), type: typeName })
        : t('look-your-default', { name: layoutName(documents.usualFormat()) }),
  );

  // What the document requires otherwise than its type, beside the changes of the look.
  const composition = new Composition(
    () => project,
    () => at,
  );
  const limitWords: Record<Limit | 'anonymous', () => string> = {
    words: () => t('look-contents-limit-words'),
    abstractWords: () => t('look-contents-limit-abstract-words'),
    keywords: () => t('look-contents-limit-keywords'),
    anonymous: () => t('template-requirement-anonymity'),
  };
  const required = $derived(
    [...composition.composition.from]
      .filter(([path]) => path.startsWith('requirements.'))
      .map(([path, who]) => {
        const key = path.slice('requirements.'.length) as Limit | 'anonymous';
        return {
          path,
          who,
          words: LIMITS.includes(key as Limit) || key === 'anonymous' ? limitWords[key]() : path,
        };
      }),
  );
</script>

<label class="row">
  <span class="what">{t('look-taken-from')}</span>
  <select
    value={own.format ?? ''}
    data-taken-from
    onchange={(e) => onchoose(e.currentTarget.value || undefined)}
  >
    <option value="">{first}</option>
    {#each formatGroups() as group (group.name)}
      <optgroup label={group.name}>
        {#each group.formats as fm (fm.id)}
          <option value={fm.id}>{fm.name}</option>
        {/each}
      </optgroup>
    {/each}
    {#if own.format && !documents.formatSummary(own.format)}
      <option value={own.format}>{own.format}</option>
    {/if}
  </select>
</label>

{#if changes.length || required.length}
  <h4>{t('look-changed-list')}</h4>
  <ul class="changed" data-changed-list>
    {#each changes as c (c.path)}
      <li>
        <span>{c.words}</span>
        <small
          >{c.who === at
            ? t('look-changed-here')
            : t('look-changed-in', { name: nameOf(c.who) })}</small
        >
        <button type="button" class="again" onclick={() => onreset(c.who, c.path)}
          >{t('look-reset')}</button
        >
      </li>
    {/each}
    {#each required as c (c.path)}
      <li>
        <span>{c.words}</span>
        <small
          >{c.who === at
            ? t('look-changed-here')
            : t('look-changed-in', { name: nameOf(c.who) })}</small
        >
        <button type="button" class="again" onclick={() => composition.takeAgain(c.who, c.path)}
          >{t('look-reset')}</button
        >
      </li>
    {/each}
  </ul>
{/if}

{#if ownType && template}
  {@const tp = template}
  {#if error}<p class="error selectable" role="alert">{error}</p>{/if}
  <label class="row">
    <span class="what">{t('look-type-field-name')}</span>
    <input value={tp.name} data-type-name onchange={(e) => rename(e.currentTarget.value)} />
  </label>
  <label class="row tall">
    <span class="what">{t('look-type-description')}</span>
    <textarea
      rows="3"
      value={tp.description}
      data-type-description
      onchange={(e) => void change({ description: e.currentTarget.value })}></textarea>
  </label>

  <h4 data-at="offered">{t('look-type-passage-kinds')}</h4>
  {#each passageGroups as group (group.id)}
    <h5>{group.label}</h5>
    {#each group.kinds as spec (spec.id)}
      <label class="row check">
        <span class="what">{spec.label()}</span>
        <input
          type="checkbox"
          data-offered={spec.id}
          checked={tp.passageKinds.includes(spec.id)}
          onchange={(e) => offerKind(spec.id, e.currentTarget.checked)}
        />
      </label>
    {/each}
  {/each}

  <h4 data-at="exported">{t('look-type-exported-as')}</h4>
  {#each TARGETS as target (target)}
    <label class="row check">
      <span class="what">{targetWords(target)}</span>
      <input
        type="checkbox"
        data-target={target}
        checked={targets.includes(target)}
        onchange={(e) => exportAs(target, e.currentTarget.checked)}
      />
    </label>
  {/each}

  <div class="actions">
    <Button size="sm" variant="danger" data-delete-type onclick={remove}
      >{t('look-type-delete')}</Button
    >
  </div>
{/if}

<style>
  .error {
    padding: 8px 12px;
    margin: 8px 0;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    white-space: pre-wrap;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0 4px;
  }
  h5 {
    margin: 14px 0 2px;
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--ink-3);
  }
  .changed {
    margin: 0 0 8px;
    padding: 6px 10px;
    list-style: none;
    border-radius: var(--radius-m);
    background: var(--paper-sunken);
    font-size: var(--text-sm);
  }
  .changed li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 8px;
    padding: 3px 0;
  }
  .changed small {
    color: var(--ink-3);
  }
  .again {
    padding: 0;
    border: none;
    background: transparent;
    color: var(--ink-3);
    font: inherit;
    font-size: var(--text-xs);
    text-decoration: underline;
    cursor: pointer;
  }
  .again:hover {
    color: var(--ink);
  }
</style>

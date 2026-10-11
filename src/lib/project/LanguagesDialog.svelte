<script lang="ts">
  /**
   * The languages of an element and of its project (ADR 0020, ADR 0037):
   * the language the element's text is written in, which it takes from the
   * nearest element over it that says one when it says none itself; and the
   * project's, which every element inherits that says nothing. Both are
   * written as they are chosen; the dialog is closed when done.
   */
  import { languageName, newTextLanguage, t, TEXT_LANGUAGES } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Select from '$lib/ui/Select.svelte';
  import type { Project } from './model/project.svelte';
  import { PROJECT } from './model/types';

  interface Props {
    project: Project;
    /** The element whose language is chosen. */
    at: string;
    onclose: () => void;
  }

  let { project, at, onclose }: Props = $props();

  /** The language the element says of its own. */
  const own = $derived(project.node(at)?.document.language ?? '');
  /** What it has with what it inherits, and which element says each thing. */
  const inherited = $derived(project.documentOf(at));
  /** The element over it whose language it takes, where it says none itself. */
  const from = $derived.by(() => {
    if (own) return null;
    const setter = inherited.from.get('language');
    return setter && setter !== at ? setter : null;
  });
  const projectLanguage = $derived(project.language ?? '');

  // Named by the system, in the language of the interface; a language the
  // list does not have, which an element may have been given elsewhere, is kept.
  function options(first: string, current: string) {
    const list = [
      { value: '', label: first },
      ...TEXT_LANGUAGES.map((tag) => ({ value: tag, label: languageName(tag) })),
    ];
    if (current && !list.some((o) => o.value === current))
      list.push({ value: current, label: languageName(current) });
    return list;
  }

  const ownOptions = $derived(
    options(
      from
        ? t('languages-map-none')
        : t('languages-project-settings', { language: languageName(newTextLanguage()) }),
      own,
    ),
  );
  const projectOptions = $derived(
    options(
      t('languages-project-settings', { language: languageName(newTextLanguage()) }),
      projectLanguage,
    ),
  );

  function setOwn(language: string) {
    if (language === own) return;
    project.checkpoint();
    project.setDocument(at, { language: language || undefined });
    project.checkpoint();
  }

  function setProjectLanguage(language: string) {
    if (language === projectLanguage) return;
    project.checkpoint();
    project.setLanguage(language || null);
    project.checkpoint();
  }
</script>

<Dialog
  open
  title={t('languages-dialog')}
  subtitle={t('languages-dialog-subtitle')}
  width={520}
  {onclose}
>
  <div class="languages">
    {#if at !== PROJECT}
      <div class="field">
        <Select value={own} options={ownOptions} label={t('languages-map')} onchange={setOwn} />
        <small>
          {#if from}
            <span class="from">
              {t('documents-inherited-from', {
                name: project.node(from)?.title || t('project-untitled'),
              })} · {languageName(inherited.settings.language ?? '')}
            </span>
          {/if}
          {t('languages-map-hint')}
        </small>
      </div>
    {/if}
    <div class="field">
      <Select
        value={projectLanguage}
        options={projectOptions}
        label={t('languages-project')}
        onchange={setProjectLanguage}
      />
      <small>{t('languages-project-hint')}</small>
    </div>
  </div>

  {#snippet footer()}
    <Button variant="primary" onclick={onclose}>{t('common-close')}</Button>
  {/snippet}
</Dialog>

<style>
  .languages {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  small {
    font-size: var(--text-xs);
    line-height: 1.45;
    color: var(--ink-4);
  }
  .from {
    display: block;
    margin-bottom: 2px;
    color: var(--ink-3);
  }
</style>

<script lang="ts">
  /**
   * The languages of a map and of its project (ADR 0020): the language this
   * map is written in, and the one new maps of the project are given. Both
   * are written as they are chosen; the dialog is closed when done.
   */
  import { languageName, newTextLanguage, t, TEXT_LANGUAGES } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Select from '$lib/ui/Select.svelte';
  import type { Project } from './model/project.svelte';

  interface Props {
    project: Project;
    mapId: string;
    onclose: () => void;
  }

  let { project, mapId, onclose }: Props = $props();

  const map = $derived(project.map(mapId));
  const mapLanguage = $derived(map?.document.language ?? '');
  const projectLanguage = $derived(project.language ?? '');

  // Named by the system, in the language of the interface; a language the
  // list does not have, which a map may have been given elsewhere, is kept.
  function options(first: string, current: string) {
    const list = [
      { value: '', label: first },
      ...TEXT_LANGUAGES.map((tag) => ({ value: tag, label: languageName(tag) })),
    ];
    if (current && !list.some((o) => o.value === current))
      list.push({ value: current, label: languageName(current) });
    return list;
  }

  const mapOptions = $derived(options(t('languages-map-none'), mapLanguage));
  const projectOptions = $derived(
    options(
      t('languages-project-settings', { language: languageName(newTextLanguage()) }),
      projectLanguage,
    ),
  );

  function setMapLanguage(language: string) {
    if (language === mapLanguage) return;
    project.checkpoint();
    project.setDocument(mapId, { language });
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
    <div class="field">
      <Select
        value={mapLanguage}
        options={mapOptions}
        label={t('languages-map')}
        onchange={setMapLanguage}
      />
      <small>{t('languages-map-hint')}</small>
    </div>
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
</style>

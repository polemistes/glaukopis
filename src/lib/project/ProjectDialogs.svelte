<!--
  The dialogs of the view of a project, mounted with it because it is the one
  place that lasts while the project is open: what is asked from the menu of
  an element (a copy compared, a kind, a kind of one's own, when it is, the
  kinds managed) is done in the project of the pane that has the focus; the
  document settings and the chooser of what a document is in the project
  they were asked for; and the template
  editor, of which a template saved anew is copied afresh into the project
  of the view where that carries it.
-->
<script lang="ts">
  import type { Template } from '$lib/api/templates';
  import DocumentSettingsWindow from '$lib/document/DocumentSettingsWindow.svelte';
  import { documentSettingsUi } from '$lib/document/document-settings.svelte';
  import TemplateChooser from '$lib/document/TemplateChooser.svelte';
  import { templateChooserUi } from '$lib/document/chooser.svelte';
  import TemplateEditor from '$lib/document/TemplateEditor.svelte';
  import { templateEditorUi } from '$lib/document/template-editor.svelte';
  import { ownKindsUi } from '$lib/editor/own-kinds.svelte';
  import { t } from '$lib/i18n';
  import { documents } from '$lib/preview/documents.svelte';
  import WhenDialog from '$lib/timeline/WhenDialog.svelte';
  import { whenUi } from '$lib/timeline/when.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import { comparing } from './copies.svelte';
  import CopyDialog from './CopyDialog.svelte';
  import KindDialog from './KindDialog.svelte';
  import KindsDialog from './KindsDialog.svelte';
  import { kindsUi } from './kinds.svelte';
  import type { Project } from './model/project.svelte';
  import PassageKindDialog from './PassageKindDialog.svelte';

  interface Props {
    /** The project of the view, once it is open. */
    project: Project | null;
    /** The project of the pane that has the focus: what the dialogs act on. */
    focused: Project | null;
    /** The element in view of the pane that has the focus. */
    at: string | undefined;
    /** Goes to an element from a dialog, in the pane that has the focus. */
    ongo: (element: string) => void;
  }

  let { project, focused, at, ongo }: Props = $props();

  /**
   * A template of the writer's own saved anew: where the project carries a
   * copy of it, or an element has chosen it, the copy is made afresh (ADR
   * 0038).
   */
  function templateSaved(id: string) {
    if (!project || !documents.templateSummary(id)?.own) return;
    if (!project.templateCopy(id) && !project.usesTemplate(id)) return;
    const p = project;
    documents
      .templateOf(id)
      .then((tp) => p.keepTemplate($state.snapshot(tp) as Template))
      .catch((error) => notifyError(t('project-template-not-renewed'), error));
  }
</script>

<!-- What is asked from the menu of an element is done in the project of the pane that has the focus. -->
{#if comparing.copy && focused}
  <CopyDialog
    project={focused}
    id={comparing.copy}
    onclose={() => (comparing.copy = null)}
    {ongo}
  />
{/if}

{#if kindsUi.editing && focused}
  {#key kindsUi.editing.id}
    <KindDialog
      project={focused}
      id={kindsUi.editing.id}
      assign={kindsUi.editing.assign}
      onclose={() => (kindsUi.editing = null)}
    />
  {/key}
{/if}

{#if ownKindsUi.editing && focused}
  {#key ownKindsUi.editing.id}
    <PassageKindDialog
      project={focused}
      id={ownKindsUi.editing.id}
      family={ownKindsUi.editing.family}
      apply={ownKindsUi.editing.apply}
      onclose={() => (ownKindsUi.editing = null)}
    />
  {/key}
{/if}

{#if documentSettingsUi.request}
  {@const asked = documentSettingsUi.request}
  {#key asked}
    <DocumentSettingsWindow
      project={asked.project}
      at={asked.at}
      section={asked.section}
      {ongo}
      onclose={() => documentSettingsUi.close()}
    />
  {/key}
{/if}

{#if templateChooserUi.request}
  {@const asked = templateChooserUi.request}
  {#key asked}
    <TemplateChooser
      project={asked.project}
      at={asked.at}
      onclose={() => templateChooserUi.close()}
    />
  {/key}
{/if}

{#if templateEditorUi.request}
  {@const asked = templateEditorUi.request}
  <TemplateEditor
    id={asked.id}
    fresh={asked.fresh}
    copy={asked.copy}
    onsaved={(id) => {
      // Held before the editor goes: what it was asked for goes with it.
      const given = asked.onsaved;
      templateEditorUi.close();
      given?.(id);
      templateSaved(id);
    }}
    onclose={() => templateEditorUi.close()}
  />
{/if}

{#if whenUi.element && focused}
  {#key whenUi.element}
    <WhenDialog
      project={focused}
      id={whenUi.element}
      {at}
      onclose={() => (whenUi.element = null)}
    />
  {/key}
{/if}

{#if kindsUi.managing && focused}
  <KindsDialog project={focused} onclose={() => (kindsUi.managing = false)} />
{/if}

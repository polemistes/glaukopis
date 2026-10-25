<script lang="ts">
  /**
   * The dialogs of what is done with projects from the list and the start
   * screen: the one that asks for a name, the earlier versions, what is to
   * be done with the works of a project file, the trash, joining a shared
   * project, and the project of all the projects. See `project-actions`.
   */
  import { t } from '$lib/i18n';
  import JoinDialog from '$lib/sharing/JoinDialog.svelte';
  import { testHook } from '$lib/shell/testing';
  import { projects } from '$lib/state/projects.svelte';
  import { router } from '$lib/state/router.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import HistoryDialog from './HistoryDialog.svelte';
  import ProjectFileDialog from './ProjectFileDialog.svelte';
  import ProjectsMapDialog from './ProjectsMapDialog.svelte';
  import TrashDialog from './TrashDialog.svelte';
  import {
    namingAction,
    namingTitle,
    ofFolder,
    type ProjectActions,
  } from './project-actions.svelte';

  let { actions }: { actions: ProjectActions } = $props();

  // The trash is read again whenever a project goes into it or comes out of it, here or by an undo.
  $effect(() => {
    void projects.trashed;
    void actions.readTrash();
  });

  // For the tests of the running application, which cannot answer the dialog
  // that chooses a file; only when the harness asks for it.
  testHook('__glaukopisOrg', { open: (path: string) => actions.openOrgAt(path) });
  testHook('__glaukopisMindMaps', {
    open: (path: string) => actions.openMindMapAt(path),
    /** Saves the project of that name, which may be the one open, as a mind map at `path`. */
    save: (name: string, path: string) => {
      const p = projects.list.find((x) => x.name === name);
      return p ? actions.saveMindMapAt(p, path, true) : Promise.reject(new Error(`no ${name}`));
    },
    fromDocument: (path: string) => actions.fromDocument(path),
  });
</script>

{#if actions.showTrash}
  <TrashDialog
    trash={actions.trash}
    onchange={async () => {
      await actions.readTrash();
      if (!actions.trash.length) actions.showTrash = false;
    }}
    onclose={() => (actions.showTrash = false)}
  />
{/if}

{#if actions.mapping}
  <ProjectsMapDialog
    onclose={() => (actions.mapping = false)}
    onmade={({ project, at }) => {
      actions.mapping = false;
      router.go({ view: 'project', project, at, mode: settings.value.newProjectView ?? 'diagram' });
    }}
  />
{/if}

{#if actions.joining}
  <JoinDialog
    onclose={() => (actions.joining = false)}
    onjoined={(p) => {
      actions.joining = false;
      actions.open(p);
    }}
  />
{/if}

{#if actions.earlier}
  <HistoryDialog
    project={actions.earlier}
    onclose={() => (actions.earlier = null)}
    onopened={(copy) => {
      actions.earlier = null;
      actions.open(copy);
    }}
  />
{/if}

{#if actions.asking}
  <ProjectFileDialog asking={actions.asking} onanswer={(choices) => actions.answer(choices)} />
{/if}

{#if actions.naming}
  {@const purpose = actions.naming.purpose}
  <Dialog open title={namingTitle(purpose)} width={440} onclose={() => (actions.naming = null)}>
    <form
      onsubmit={(e) => {
        e.preventDefault();
        actions.commit();
      }}
    >
      <TextField
        bind:value={actions.naming.value}
        label={t('home-name')}
        size="lg"
        serif={!ofFolder(purpose)}
        placeholder={ofFolder(purpose)
          ? t('home-folder-name-placeholder')
          : t('home-name-placeholder')}
        error={actions.naming.error}
        data-autofocus
        oninput={() => actions.naming && (actions.naming.error = null)}
      />
    </form>
    {#snippet footer()}
      <Button variant="ghost" onclick={() => (actions.naming = null)}>{t('common-cancel')}</Button>
      <Button
        variant="primary"
        disabled={actions.busy || !actions.naming?.value.trim()}
        onclick={() => actions.commit()}
      >
        {namingAction(purpose)}
      </Button>
    {/snippet}
  </Dialog>
{/if}

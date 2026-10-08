<script lang="ts">
  /**
   * The dialogs of what is done with a project from a list of them: the one
   * that asks for a name, and the earlier versions. See `project-actions`.
   */
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import HistoryDialog from './HistoryDialog.svelte';
  import {
    namingAction,
    namingTitle,
    ofFolder,
    type ProjectActions,
  } from './project-actions.svelte';

  let { actions }: { actions: ProjectActions } = $props();
</script>

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

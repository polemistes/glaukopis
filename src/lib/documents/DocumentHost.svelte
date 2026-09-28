<script lang="ts">
  import DocumentDialog from './DocumentDialog.svelte';
  import { documents } from './bringing.svelte';

  // Where this is, documents can be brought in; when it goes, what was asked for is not wanted.
  $effect(() => () => {
    documents.request?.resolve(null);
    documents.request = null;
  });
</script>

{#if documents.request}
  {#key documents.request}
    <DocumentDialog request={documents.request} onclose={() => (documents.request = null)} />
  {/key}
{/if}

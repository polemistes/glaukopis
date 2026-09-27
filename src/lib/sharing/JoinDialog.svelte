<script lang="ts">
  import { sharingJoin, sharingReadInvitation } from '$lib/api/sharing';
  import type { ProjectInfo } from '$lib/api/projects';
  import { isBackendError } from '$lib/api/backend';
  import { projects } from '$lib/state/projects.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { describeError } from '$lib/ui/toast.svelte';

  let { onclose, onjoined }: { onclose: () => void; onjoined: (project: ProjectInfo) => void } =
    $props();

  let server = $state(settings.value.server ?? '');
  let code = $state('');
  let name = $state(settings.value.displayName ?? '');
  let serverProblem = $state<string | null>(null);
  let codeProblem = $state<string | null>(null);
  let busy = $state(false);

  /**
   * An invitation pasted whole, into either field, is taken apart: the fields
   * are filled from what is read of it, not with all of it.
   */
  function pasted(event: ClipboardEvent) {
    const text = (event.clipboardData?.getData('text/plain') ?? '').trim();
    if (!/\s/.test(text)) return;
    const field = event.currentTarget as HTMLInputElement;
    event.preventDefault();
    sharingReadInvitation(text)
      .then((read) => {
        if (read.server) server = read.server;
        if (read.code) code = read.code;
        return read.server || read.code;
      })
      .catch(() => null)
      .then((understood) => {
        // What could not be made sense of is put where it was pasted.
        if (understood) return;
        if (field.name === 'code') code = text;
        else server = text;
      });
  }

  async function join() {
    if (busy) return;
    busy = true;
    serverProblem = null;
    codeProblem = null;
    try {
      const info = await sharingJoin(server, code, name.trim());
      if (name.trim()) settings.set('displayName', name.trim());
      if (info.sharing) settings.set('server', info.sharing.server);
      projects.put(info);
      onjoined(info);
    } catch (error) {
      const message = describeError(error) ?? 'That did not work.';
      const kind = isBackendError(error) ? error.kind : '';
      if (kind === 'bad-code' || kind === 'too-many') codeProblem = message;
      else if (message.includes('code is for')) codeProblem = message;
      else serverProblem = message;
    } finally {
      busy = false;
    }
  }
</script>

<Dialog
  open
  title="Join a shared project"
  subtitle="With the server and the code you were sent"
  width={440}
  {onclose}
>
  <form
    onsubmit={(e) => {
      e.preventDefault();
      join();
    }}
  >
    <TextField
      bind:value={server}
      label="Server"
      name="server"
      placeholder="glaukopis.example.org"
      spellcheck="false"
      autocapitalize="off"
      error={serverProblem}
      data-autofocus
      onpaste={pasted}
      oninput={() => (serverProblem = null)}
    />
    <TextField
      bind:value={code}
      label="Code"
      name="code"
      placeholder="XXXX-XXXX-XXXX"
      spellcheck="false"
      autocapitalize="characters"
      error={codeProblem}
      onpaste={pasted}
      oninput={() => (codeProblem = null)}
    />
    <TextField
      bind:value={name}
      label="Your name"
      hint="Shown to the others in the project."
      placeholder="As the others know you"
    />
    <!-- So that Enter in a field joins. -->
    <button type="submit" hidden aria-hidden="true" tabindex="-1"></button>
  </form>
  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>Cancel</Button>
    <Button
      variant="primary"
      disabled={busy || !server.trim() || code.trim().length < 12}
      onclick={join}
    >
      {busy ? 'Joining…' : 'Join'}
    </Button>
  {/snippet}
</Dialog>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>

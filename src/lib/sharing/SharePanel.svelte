<script lang="ts">
  import Check from '@lucide/svelte/icons/check';
  import Copy from '@lucide/svelte/icons/copy';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import X from '@lucide/svelte/icons/x';
  import {
    sharingInvite,
    sharingRemoveMember,
    sharingRoom,
    sharingServer,
    sharingWithdraw,
    FINAL,
    type Invitation,
    type Room,
    type ServerInfo,
  } from '$lib/api/sharing';
  import { isBackendError } from '$lib/api/backend';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { ask, confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Select from '$lib/ui/Select.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { describeError, notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import { ago } from '$lib/util/time';
  import { colourOf, initials } from './connection.svelte';
  import type { ProjectSharing } from './sharing.svelte';

  interface Props {
    shared: ProjectSharing;
    projectId: string;
    projectName: string;
    onclose: () => void;
  }

  let { shared, projectId, projectName, onclose }: Props = $props();

  // ---- before the project is shared ----
  let server = $state(settings.value.server ?? '');
  let name = $state(settings.value.displayName ?? '');
  let password = $state('');
  let found = $state<ServerInfo | null>(null);
  let problem = $state<string | null>(null);
  let wrongPassword = $state<string | null>(null);
  let busy = $state(false);

  async function look(): Promise<ServerInfo | null> {
    problem = null;
    if (!server.trim()) return null;
    try {
      found = await sharingServer(server);
      return found;
    } catch (error) {
      found = null;
      problem = describeError(error) ?? 'The server could not be reached.';
      return null;
    }
  }

  async function publish() {
    if (busy) return;
    busy = true;
    wrongPassword = null;
    try {
      const info = found ?? (await look());
      if (!info) return;
      if (info.passwordRequired && !password) return;
      if (name.trim()) settings.set('displayName', name.trim());
      await shared.publish(info.server, info.passwordRequired ? password : null);
      password = '';
      await refresh();
    } catch (error) {
      if (isBackendError(error) && error.kind === 'password') wrongPassword = error.message;
      else problem = describeError(error) ?? 'The project could not be shared.';
    } finally {
      busy = false;
    }
  }

  // ---- while it is shared ----
  let room = $state<Room | null>(null);
  let roomProblem = $state<string | null>(null);
  let fresh = $state<Invitation | null>(null);
  let copied = $state(false);
  let options = $state(false);
  let uses = $state<'one' | 'many'>('one');
  let valid = $state<'day' | 'week' | 'month' | 'ever'>('week');

  const sharing = $derived(shared.sharing);
  const connection = $derived(shared.connection);
  const owner = $derived(sharing?.owner ?? false);
  const host = $derived(sharing ? sharing.server.replace(/^https?:\/\//, '') : '');
  const open = $derived((room?.invitations ?? []).filter((i) => i.open));
  const HOURS = { day: 24, week: 24 * 7, month: 24 * 30, ever: null };

  async function refresh() {
    if (!shared.shared) return;
    try {
      room = await sharingRoom(projectId);
      roomProblem = null;
    } catch (error) {
      // The connection hears of it too, and tells the user why the sharing has ended.
      if (isBackendError(error) && FINAL.includes(error.kind)) connection?.retry();
      roomProblem = describeError(error) ?? null;
    }
  }

  $effect(() => {
    if (!shared.shared) return;
    // Again when someone comes or goes.
    void shared.others.length;
    void refresh();
  });

  function invitationText(code: string): string {
    return [
      `Join “${projectName}” in Glaukopis: choose “Join a shared project” and enter`,
      '',
      `Server: ${sharing?.server ?? ''}`,
      `Code: ${code}`,
    ].join('\n');
  }

  async function invite() {
    if (busy) return;
    busy = true;
    try {
      fresh = await sharingInvite(projectId, '', uses === 'one' ? 1 : null, HOURS[valid]);
      copied = false;
      await refresh();
    } catch (error) {
      notifyError('The invitation could not be made', error);
    } finally {
      busy = false;
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(invitationText(code));
      copied = true;
      notifyOk('The invitation was copied', 'Paste it into a message to the one you invite.');
    } catch (error) {
      notifyError('The invitation could not be copied', error);
    }
  }

  async function withdraw(invitation: Invitation) {
    try {
      await sharingWithdraw(projectId, invitation.code);
      if (fresh?.code === invitation.code) fresh = null;
      await refresh();
    } catch (error) {
      notifyError('The invitation could not be withdrawn', error);
    }
  }

  async function removeMember(id: string, who: string) {
    const ok = await confirm({
      title: `Remove ${who}?`,
      message: `${who} keeps the project as it is now, and is no longer given what is written after this.`,
      confirm: 'Remove',
      danger: true,
    });
    if (!ok) return;
    try {
      await sharingRemoveMember(projectId, id);
      await refresh();
    } catch (error) {
      notifyError(`${who} could not be removed`, error);
    }
  }

  async function end() {
    const ok = await confirm(
      owner
        ? {
            title: 'Stop sharing this project?',
            message:
              'The project is taken off the server. You and everyone you have shared it with keep it as it is now, each on their own.',
            confirm: 'Stop sharing',
            danger: true,
          }
        : {
            title: 'Leave this project?',
            message:
              'You keep the project as it is now. You are no longer given what the others write, nor they what you write.',
            confirm: 'Leave',
            danger: true,
          },
    );
    if (!ok) return;
    busy = true;
    try {
      await shared.end();
      room = null;
      fresh = null;
      onclose();
      notifyOk(owner ? 'The project is no longer shared' : 'You have left the project');
    } catch (error) {
      const answer = await ask({
        title: 'The server could not be told',
        message: `${describeError(error) ?? ''} You can end the sharing on this computer all the same; the project then stays on the server until it can be told.`,
        confirm: 'End it here',
        cancel: 'Keep sharing',
        danger: true,
      });
      if (answer === 'confirm') {
        try {
          await shared.end(true);
          onclose();
        } catch (again) {
          notifyError('The sharing could not be ended', again);
        }
      }
    } finally {
      busy = false;
    }
  }

  function expires(i: Invitation): string {
    const parts = [
      i.usesLeft === null
        ? 'for several'
        : i.usesLeft === 1
          ? 'for one person'
          : `for ${i.usesLeft} more`,
    ];
    if (i.expires !== null) {
      const hours = Math.max(1, Math.round((i.expires * 1000 - Date.now()) / 3_600_000));
      parts.push(hours < 48 ? `${hours} h left` : `${Math.round(hours / 24)} days left`);
    }
    if (i.used) parts.push(`used ${i.used === 1 ? 'once' : `${i.used} times`}`);
    return parts.join(' · ');
  }

  function commitName() {
    const clean = name.trim();
    if (clean === (settings.value.displayName ?? '')) return;
    settings.set('displayName', clean || null);
    shared.introduce();
  }
</script>

<Dialog
  open
  title={shared.shared ? 'Shared project' : 'Share this project'}
  subtitle={shared.shared ? `Through ${host}` : undefined}
  width={500}
  {onclose}
>
  {#if !shared.shared}
    <form
      class="setup"
      onsubmit={(e) => {
        e.preventDefault();
        publish();
      }}
    >
      <p class="lead">
        Others can then work on the project with you, at the same time, through a server. It stays
        on your computer as well, and can be worked on without the server.
      </p>
      <TextField
        bind:value={server}
        label="Server"
        placeholder="glaukopis.example.org"
        spellcheck="false"
        autocapitalize="off"
        error={problem}
        data-autofocus
        oninput={() => {
          found = null;
          problem = null;
        }}
        onblur={look}
      >
        {#snippet trailing()}
          {#if found}<span class="found"><Check size={14} /></span>{/if}
        {/snippet}
      </TextField>
      {#if found && !found.encrypted}
        <p class="warning">
          <TriangleAlert size={14} />
          What is sent to this server is not encrypted on its way. Use it on a network you trust.
        </p>
      {/if}
      {#if found?.passwordRequired}
        <TextField
          bind:value={password}
          type="password"
          label="Password of the server"
          hint="Asked of those who share projects through it. Those you invite need none."
          error={wrongPassword}
          oninput={() => (wrongPassword = null)}
        />
      {/if}
      <TextField
        bind:value={name}
        label="Your name"
        hint="Shown to those you share the project with."
        placeholder="As the others know you"
      />
    </form>
  {:else}
    <div class="shared">
      <div class="state" class:off={connection?.status !== 'connected'}>
        <span class="dot"></span>
        {#if connection?.status === 'connected'}
          Connected. What is written is with the others at once.
        {:else if connection?.status === 'connecting'}
          Connecting…
        {:else}
          The server cannot be reached. What you write is kept here, and brought along when it can.
        {/if}
      </div>

      {#if owner}
        <section>
          <h3 class="overline">Invite</h3>
          {#if fresh}
            <div class="fresh">
              <div class="code" aria-label="Invitation code">{fresh.code}</div>
              <Button
                variant={copied ? 'secondary' : 'primary'}
                onclick={() => fresh && copy(fresh.code)}
              >
                {#snippet icon()}{#if copied}<Check size={14} />{:else}<Copy
                      size={14}
                    />{/if}{/snippet}
                {copied ? 'Copied' : 'Copy invitation'}
              </Button>
            </div>
            <p class="hint">
              Send it to the one you invite, who chooses <em>Join a shared project</em> and enters
              the server and the code. It is {expires(fresh)}.
            </p>
          {/if}
          <div class="invite">
            <Button disabled={busy} onclick={invite}
              >{fresh ? 'Make another code' : 'Make an invitation code'}</Button
            >
            <button type="button" class="link" onclick={() => (options = !options)}>
              {options ? 'Fewer options' : 'Options'}
            </button>
          </div>
          {#if options}
            <div class="options">
              <Select
                bind:value={uses}
                label="For"
                size="sm"
                options={[
                  { value: 'one', label: 'One person' },
                  { value: 'many', label: 'Several people' },
                ]}
              />
              <Select
                bind:value={valid}
                label="Good for"
                size="sm"
                options={[
                  { value: 'day', label: 'A day' },
                  { value: 'week', label: 'A week' },
                  { value: 'month', label: 'A month' },
                  { value: 'ever', label: 'Until withdrawn' },
                ]}
              />
            </div>
          {/if}
          {#if open.filter((i) => i.code !== fresh?.code).length}
            <ul class="codes">
              {#each open.filter((i) => i.code !== fresh?.code) as i (i.code)}
                <li>
                  <span class="small-code">{i.code}</span>
                  <span class="about truncate">{expires(i)}</span>
                  <IconButton label="Copy invitation" size="sm" onclick={() => copy(i.code)}>
                    <Copy size={13} />
                  </IconButton>
                  <IconButton label="Withdraw" size="sm" onclick={() => withdraw(i)}
                    ><X size={13} /></IconButton
                  >
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      {/if}

      <section>
        <h3 class="overline">Who has the project</h3>
        {#if !room}
          {#if roomProblem}
            <p class="hint">The list is with the server, which cannot be reached.</p>
          {:else}
            <div class="waiting"><Spinner size={16} /></div>
          {/if}
        {:else}
          <ul class="people">
            <li>
              <span class="avatar" style:background={colourOf(`owner:${room.room}`)}>
                {initials(owner ? shared.name : 'Owner')}
              </span>
              <span class="who">
                <span class="name">{owner ? `${shared.name} (you)` : 'The one who shares it'}</span>
                <span class="about">{room.ownerPresent ? 'Here now' : 'Not here now'}</span>
              </span>
            </li>
            {#each room.members as m (m.id)}
              <li>
                <span class="avatar" style:background={colourOf(m.id)}>{initials(m.name)}</span>
                <span class="who">
                  <span class="name truncate">{m.name}{m.id === room.you ? ' (you)' : ''}</span>
                  <span class="about">
                    {m.present
                      ? 'Here now'
                      : `Last here ${ago(new Date(m.lastSeen * 1000).toISOString())}`}
                  </span>
                </span>
                {#if owner}
                  <IconButton
                    label="Remove {m.name}"
                    size="sm"
                    onclick={() => removeMember(m.id, m.name)}
                  >
                    <X size={13} />
                  </IconButton>
                {/if}
              </li>
            {/each}
          </ul>
          {#if owner && !room.members.length}
            <p class="hint">No one has joined yet.</p>
          {/if}
        {/if}
      </section>

      <section>
        <TextField
          bind:value={name}
          label="Your name"
          size="sm"
          hint="As the others see you."
          onblur={commitName}
          onkeydown={(e) => e.key === 'Enter' && commitName()}
        />
      </section>
    </div>
  {/if}

  {#snippet footer()}
    {#if !shared.shared}
      <Button variant="ghost" onclick={onclose}>Cancel</Button>
      <Button
        variant="primary"
        disabled={busy || !server.trim() || (found?.passwordRequired && !password)}
        onclick={publish}
      >
        {busy ? 'Sharing…' : 'Share'}
      </Button>
    {:else}
      <Button variant="ghost" disabled={busy} onclick={end}
        >{owner ? 'Stop sharing' : 'Leave the project'}</Button
      >
      <span class="spring"></span>
      <Button variant="primary" onclick={onclose}>Done</Button>
    {/if}
  {/snippet}
</Dialog>

<style>
  .setup,
  .shared {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .lead {
    color: var(--ink-2);
    line-height: 1.55;
  }
  .found {
    display: inline-flex;
    color: var(--ok);
  }
  .warning {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-top: -8px;
    padding: 8px 10px;
    border-radius: var(--radius-m);
    background: var(--gold-soft);
    color: var(--ink);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .warning :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--warn);
  }
  .state {
    display: flex;
    align-items: baseline;
    gap: 9px;
    padding: 9px 12px;
    border-radius: var(--radius-m);
    background: var(--ok-soft);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .state.off {
    background: var(--paper-sunken);
    color: var(--ink-2);
  }
  .dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ok);
    transform: translateY(-1px);
  }
  .state.off .dot {
    background: var(--ink-4);
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  h3 {
    margin: 0;
  }
  .fresh {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 12px 12px 16px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--paper);
  }
  .code {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 19px;
    font-weight: 600;
    letter-spacing: 0.06em;
    user-select: all;
  }
  .hint {
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .invite {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .link {
    padding: 0;
    border: none;
    background: none;
    color: var(--accent-strong);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .link:hover {
    text-decoration: underline;
  }
  .options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .codes li,
  .people li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 34px;
  }
  .codes li + li,
  .people li + li {
    border-top: 1px solid var(--line);
  }
  .small-code {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    letter-spacing: 0.03em;
  }
  .about {
    flex: 1;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .people li {
    padding: 6px 0;
  }
  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    color: #fff;
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0.02em;
  }
  .who {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    line-height: 1.35;
  }
  .name {
    font-weight: 550;
  }
  .waiting {
    display: flex;
    justify-content: center;
    padding: 10px 0;
  }
  .spring {
    flex: 1;
  }
</style>

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
  import { t } from '$lib/i18n';
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
  import { apart, PLACE } from '$lib/util/words';
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
      problem = describeError(error) ?? t('sharing-unreachable');
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
      else problem = describeError(error) ?? t('sharing-share-failed');
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
      t('sharing-invitation', { project: projectName, join: t('home-join') }),
      '',
      t('sharing-invitation-server', { server: sharing?.server ?? '' }),
      t('sharing-invitation-code', { code }),
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
      notifyError(t('sharing-invite-failed'), error);
    } finally {
      busy = false;
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(invitationText(code));
      copied = true;
      notifyOk(t('sharing-copied'), t('sharing-copied-detail'));
    } catch (error) {
      notifyError(t('sharing-copy-failed'), error);
    }
  }

  async function withdraw(invitation: Invitation) {
    try {
      await sharingWithdraw(projectId, invitation.id);
      if (fresh?.id === invitation.id) fresh = null;
      await refresh();
    } catch (error) {
      notifyError(t('sharing-withdraw-failed'), error);
    }
  }

  async function removeMember(id: string, who: string) {
    const ok = await confirm({
      title: t('sharing-remove-title', { name: who }),
      message: t('sharing-remove-message', { name: who }),
      confirm: t('common-remove'),
      danger: true,
    });
    if (!ok) return;
    try {
      await sharingRemoveMember(projectId, id);
      await refresh();
    } catch (error) {
      notifyError(t('sharing-remove-failed', { name: who }), error);
    }
  }

  async function end() {
    const ok = await confirm(
      owner
        ? {
            title: t('sharing-stop-title'),
            message: t('sharing-stop-message'),
            confirm: t('sharing-stop'),
            danger: true,
          }
        : {
            title: t('sharing-leave-title'),
            message: t('sharing-leave-message'),
            confirm: t('sharing-leave'),
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
      notifyOk(owner ? t('sharing-stopped') : t('sharing-left'));
    } catch (error) {
      const answer = await ask({
        title: t('sharing-untold-title'),
        message: t('sharing-untold-message', { error: describeError(error) ?? '' }),
        confirm: t('sharing-end-here'),
        cancel: t('sharing-keep'),
        danger: true,
      });
      if (answer === 'confirm') {
        try {
          await shared.end(true);
          onclose();
        } catch (again) {
          notifyError(t('sharing-end-failed'), again);
        }
      }
    } finally {
      busy = false;
    }
  }

  function expires(i: Invitation): string {
    const parts = [
      i.usesLeft === null
        ? t('sharing-for-several')
        : i.usesLeft === 1
          ? t('sharing-for-one')
          : t('sharing-for-more', { count: i.usesLeft }),
    ];
    if (i.expires !== null) {
      const hours = Math.max(1, Math.round((i.expires * 1000 - Date.now()) / 3_600_000));
      parts.push(
        hours < 48
          ? t('sharing-hours-left', { count: hours })
          : t('sharing-days-left', { count: Math.round(hours / 24) }),
      );
    }
    if (i.used) parts.push(t('sharing-used', { count: i.used }));
    return parts.join(' · ');
  }

  // The name of the button the one invited chooses is in italics, where the language puts it.
  const [beforeJoin, afterJoin] = $derived(
    apart(t('sharing-invite-hint', { join: PLACE, expires: fresh ? expires(fresh) : '' })),
  );

  function commitName() {
    const clean = name.trim();
    if (clean === (settings.value.displayName ?? '')) return;
    settings.set('displayName', clean || null);
    shared.introduce();
  }
</script>

<Dialog
  open
  title={shared.shared ? t('sharing-shared-title') : t('sharing-share-title')}
  subtitle={shared.shared ? t('sharing-through', { server: host }) : undefined}
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
        {t('sharing-lead')}
      </p>
      <TextField
        bind:value={server}
        label={t('sharing-server')}
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
          {t('sharing-unencrypted')}
        </p>
      {/if}
      {#if found?.passwordRequired}
        <TextField
          bind:value={password}
          type="password"
          label={t('sharing-password')}
          hint={t('sharing-password-hint')}
          error={wrongPassword}
          oninput={() => (wrongPassword = null)}
        />
      {/if}
      <TextField
        bind:value={name}
        label={t('sharing-your-name')}
        hint={t('sharing-your-name-hint')}
        placeholder={t('sharing-your-name-placeholder')}
      />
    </form>
  {:else}
    <div class="shared">
      <div
        class="state"
        class:off={connection?.status !== 'connected'}
        class:refused={connection?.tooLarge}
        role={connection?.tooLarge ? 'alert' : undefined}
      >
        <span class="dot"></span>
        {#if connection?.tooLarge}
          {t('sharing-too-large')}
        {:else if connection?.status === 'connected'}
          {t('sharing-connected')}
        {:else if connection?.status === 'connecting'}
          {t('sharing-connecting')}
        {:else}
          {t('sharing-offline')}
        {/if}
      </div>

      {#if owner}
        <section>
          <h3 class="overline">{t('sharing-invite')}</h3>
          {#if fresh}
            <div class="fresh">
              <div class="code" aria-label={t('sharing-code-label')}>{fresh.code}</div>
              <Button
                variant={copied ? 'secondary' : 'primary'}
                onclick={() => fresh?.code && copy(fresh.code)}
              >
                {#snippet icon()}{#if copied}<Check size={14} />{:else}<Copy
                      size={14}
                    />{/if}{/snippet}
                {copied ? t('sharing-copied-button') : t('sharing-copy')}
              </Button>
            </div>
            <p class="hint">
              {beforeJoin}<em>{t('home-join')}</em>{afterJoin}
            </p>
          {/if}
          <div class="invite">
            <Button disabled={busy} onclick={invite}
              >{fresh ? t('sharing-make-another') : t('sharing-make-code')}</Button
            >
            <button type="button" class="link" onclick={() => (options = !options)}>
              {options ? t('sharing-fewer-options') : t('sharing-options')}
            </button>
          </div>
          {#if options}
            <div class="options">
              <Select
                bind:value={uses}
                label={t('sharing-for')}
                size="sm"
                options={[
                  { value: 'one', label: t('sharing-one-person') },
                  { value: 'many', label: t('sharing-several-people') },
                ]}
              />
              <Select
                bind:value={valid}
                label={t('sharing-good-for')}
                size="sm"
                options={[
                  { value: 'day', label: t('sharing-a-day') },
                  { value: 'week', label: t('sharing-a-week') },
                  { value: 'month', label: t('sharing-a-month') },
                  { value: 'ever', label: t('sharing-until-withdrawn') },
                ]}
              />
            </div>
          {/if}
          {#if open.filter((i) => i.id !== fresh?.id).length}
            <ul class="codes">
              {#each open.filter((i) => i.id !== fresh?.id) as i (i.id)}
                <li>
                  <span class="small-code" aria-label={t('sharing-code-ending', { hint: i.hint })}
                    >…{i.hint}</span
                  >
                  <span class="about truncate">{expires(i)}</span>
                  <IconButton label={t('sharing-withdraw')} size="sm" onclick={() => withdraw(i)}
                    ><X size={13} /></IconButton
                  >
                </li>
              {/each}
            </ul>
            <p class="hint">{t('sharing-codes-once')}</p>
          {/if}
        </section>
      {/if}

      <section>
        <h3 class="overline">{t('sharing-who')}</h3>
        {#if !room}
          {#if roomProblem}
            <p class="hint">{t('sharing-list-unreachable')}</p>
          {:else}
            <div class="waiting"><Spinner size={16} /></div>
          {/if}
        {:else}
          <ul class="people">
            <li>
              <span class="avatar" style:background={colourOf(`owner:${room.room}`)}>
                {initials(owner ? shared.name : t('sharing-owner'))}
              </span>
              <span class="who">
                <span class="name"
                  >{owner ? t('sharing-you', { name: shared.name }) : t('sharing-the-owner')}</span
                >
                <span class="about"
                  >{room.ownerPresent ? t('sharing-here') : t('sharing-not-here')}</span
                >
              </span>
            </li>
            {#each room.members as m (m.id)}
              <li>
                <span class="avatar" style:background={colourOf(m.id)}>{initials(m.name)}</span>
                <span class="who">
                  <span class="name truncate"
                    >{m.id === room.you ? t('sharing-you', { name: m.name }) : m.name}</span
                  >
                  <span class="about">
                    {m.present
                      ? t('sharing-here')
                      : t('sharing-last-here', {
                          ago: ago(new Date(m.lastSeen * 1000).toISOString()),
                        })}
                  </span>
                </span>
                {#if owner}
                  <IconButton
                    label={t('sharing-remove-member', { name: m.name })}
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
            <p class="hint">{t('sharing-none-joined')}</p>
          {/if}
        {/if}
      </section>

      <section>
        <TextField
          bind:value={name}
          label={t('sharing-your-name')}
          size="sm"
          hint={t('sharing-your-name-seen')}
          onblur={commitName}
          onkeydown={(e) => e.key === 'Enter' && commitName()}
        />
      </section>
    </div>
  {/if}

  {#snippet footer()}
    {#if !shared.shared}
      <Button variant="ghost" onclick={onclose}>{t('common-cancel')}</Button>
      <Button
        variant="primary"
        disabled={busy || !server.trim() || (found?.passwordRequired && !password)}
        onclick={publish}
      >
        {busy ? t('sharing-sharing') : t('sharing-share')}
      </Button>
    {:else}
      <Button variant="ghost" disabled={busy} onclick={end}
        >{owner ? t('sharing-stop') : t('sharing-leave-project')}</Button
      >
      <span class="spring"></span>
      <Button variant="primary" onclick={onclose}>{t('common-done')}</Button>
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
  .state.refused {
    background: var(--danger-soft);
    color: var(--ink);
  }
  .state.refused .dot {
    background: var(--danger);
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

<script lang="ts">
  /**
   * Synchronization in the settings (record 0120): turned on once for this
   * device, by starting on a server or by joining with a code made on
   * another device; and, while it is on, how it stands, the devices, a code
   * for one more, and leaving. What the server cannot be asked is said where
   * it was asked.
   *
   * The one section for a computer and for a phone (record 0122): `takes`
   * says what the device takes of what is synchronized, as the engine names
   * it. A phone takes the notes (and the references of the library without
   * their files), and says so in its own words; it is made to fit a narrow
   * page, from 320 pixels.
   */
  import { onMount, untrack } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { isBackendError } from '$lib/api/backend';
  import { sharingServer, type ServerInfo } from '$lib/api/sharing';
  import { syncDevice, type SyncDevice } from '$lib/api/sync';
  import { languages, t } from '$lib/i18n';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { describeError, notifyError } from '$lib/ui/toast.svelte';
  import { ago } from '$lib/util/time';
  import { apart, PLACE } from '$lib/util/words';
  import { sync } from './sync.svelte';

  let { takes = 'everything' }: { takes?: 'everything' | 'notes' } = $props();

  const status = $derived(sync.status);

  // ---- before it is on ----
  let server = $state(settings.value.server ?? '');
  let name = $state('');
  let how = $state<'start' | 'join'>('start');
  let password = $state('');
  let code = $state('');
  /** The server as it answered, once it has. */
  let found = $state<ServerInfo | null>(null);
  /** Whether a password is to be asked: the server said so, or refused for the want of one. */
  let passwordAsked = $state(false);
  let serverProblem = $state<string | null>(null);
  let passwordProblem = $state<string | null>(null);
  let codeProblem = $state<string | null>(null);
  let busy = $state(false);

  onMount(() => {
    void sync.follow();
    // The devices are asked of the server each time the section is shown.
    sync.home = null;
    sync.homeProblem = null;
    // A code that can no longer be used is not shown again.
    if (sync.code && sync.code.expires * 1000 <= Date.now()) sync.code = null;
    // The name the system gives this device is offered; the writer may change it before it is sent.
    syncDevice()
      .then((given) => {
        if (!name) name = given;
      })
      .catch(() => {});
  });

  /** Asks the server whether it is there, and whether it asks for a password. */
  async function look() {
    serverProblem = null;
    if (!server.trim()) return;
    try {
      found = await sharingServer(server.trim());
      if (found.passwordRequired) passwordAsked = true;
    } catch (error) {
      found = null;
      serverProblem = describeError(error) ?? t('sync-unreachable');
    }
  }

  const ready = $derived(
    !!server.trim() &&
      !!name.trim() &&
      (how === 'start' ? !passwordAsked || !!password : code.trim().length >= 12),
  );

  async function begin() {
    if (busy || !ready) return;
    busy = true;
    serverProblem = passwordProblem = codeProblem = null;
    try {
      if (how === 'start') await sync.start(server, name, passwordAsked ? password : null);
      else await sync.join(server, code, name);
      password = '';
      code = '';
    } catch (error) {
      const message = describeError(error) ?? t('sync-unreachable');
      const kind = isBackendError(error) ? error.kind : '';
      if (kind === 'password') {
        passwordAsked = true;
        passwordProblem = message;
      } else if (how === 'join' && (kind === 'bad-code' || kind === 'too-many'))
        codeProblem = message;
      else serverProblem = message;
    } finally {
      busy = false;
    }
  }

  // ---- while it is on ----
  const host = $derived(status?.server?.replace(/^https?:\/\//, '') ?? '');
  const devices = $derived(
    [...(sync.home?.devices ?? [])].sort(
      (a, b) => Number(b.you) - Number(a.you) || a.name.localeCompare(b.name, languages.current),
    ),
  );
  const refused = $derived(status?.state === 'refused');
  /**
   * Stopped for a later form, until the application is updated: the engine
   * says what is needed as the problem, and makes no round, so none is
   * offered. The devices are still told and taken out, and the device can
   * still leave.
   */
  const outdated = $derived(status?.state === 'outdated');

  // The devices, while it is on and they are not yet known: asked once
  // more where they could not be told. It depends on whether it is on and
  // on what is known of them; the asking is read untracked.
  $effect(() => {
    if (!sync.on || refused || sync.home || sync.homeProblem !== null) return;
    untrack(() => void sync.askHome());
  });
  let codeFailure = $state<string | null>(null);
  let removeFailure = $state<string | null>(null);
  let making = $state(false);

  const when = (seconds: number) => ago(new Date(seconds * 1000).toISOString());

  /** What stands in the line of how it is: what is done now, or when it was last done. */
  const standing = $derived.by(() => {
    if (!status) return '';
    if (status.state === 'working') return t('sync-working');
    if (status.state === 'offline') return t('sync-offline');
    if (status.state === 'refused' || status.state === 'outdated') return t('sync-refused');
    return status.last ? t('sync-last', { when: ago(status.last) }) : t('sync-never');
  });
  const well = $derived(status?.state === 'idle' && !status.problem && !!status.last);
  /** Nothing is wrong, and nothing was brought to be the same yet: the first round is on its way. */
  const beginning = $derived(status?.state === 'idle' && !status.problem && !status.last);

  async function makeCode() {
    if (making) return;
    making = true;
    codeFailure = null;
    try {
      await sync.makeCode();
    } catch (error) {
      codeFailure = describeError(error) ?? '';
    } finally {
      making = false;
    }
  }

  const until = $derived(
    sync.code
      ? new Date(sync.code.expires * 1000).toLocaleTimeString(languages.current, {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
  );
  // The name of the choice the other device makes is in italics, where the language puts it.
  const [beforeJoin, afterJoin] = $derived(
    apart(t('sync-code-hint', { join: PLACE, until: until })),
  );

  // ---- renaming and removing ----
  let renaming = $state<SyncDevice | null>(null);
  let newName = $state('');
  let renameProblem = $state<string | null>(null);

  function rename(device: SyncDevice) {
    renaming = device;
    newName = device.name;
    renameProblem = null;
  }

  async function commitRename() {
    const device = renaming;
    if (!device || !newName.trim() || busy) return;
    busy = true;
    try {
      await sync.rename(device.id, newName);
      renaming = null;
    } catch (error) {
      renameProblem = describeError(error) ?? '';
    } finally {
      busy = false;
    }
  }

  async function remove(device: SyncDevice) {
    const ok = await confirm({
      title: t('sync-remove-title', { name: device.name }),
      message: t('sync-remove-message'),
      confirm: t('common-remove'),
      danger: true,
    });
    if (!ok) return;
    removeFailure = null;
    try {
      await sync.remove(device.id);
    } catch (error) {
      removeFailure = t('sync-remove-failed', {
        name: device.name,
        why: describeError(error) ?? '',
      });
    }
  }

  async function stop() {
    // Whether this is the only device is known where the server could be asked;
    // where it could not, the question is the usual one. The last device that
    // takes the notes only, a phone, takes off the server the projects and the
    // files of the library it never held: that is said before it is asked.
    const alone = !!sync.home && sync.home.devices.length <= 1;
    const ok = await confirm({
      title: t('sync-stop-title'),
      message: !alone
        ? t('sync-stop-message')
        : takes === 'notes'
          ? t('sync-stop-message-alone-notes')
          : t('sync-stop-message-alone'),
      confirm: t('sync-stop-confirm'),
      danger: true,
    });
    if (!ok) return;
    busy = true;
    try {
      await sync.stop();
      found = null;
      passwordAsked = false;
      how = 'start';
      server = settings.value.server ?? server;
    } catch (error) {
      notifyError(t('sync-stop-failed'), error);
    } finally {
      busy = false;
    }
  }
</script>

<section class="sync" data-synchronization={status?.state ?? ''} data-sync-takes={takes}>
  <h2>{t('sync-title')}</h2>
  {#if !status}
    <div class="waiting"><Spinner size={16} /></div>
  {:else if !status.on}
    <p class="about" data-sync-about>
      {takes === 'notes' ? t('sync-about-notes') : t('sync-about')}
    </p>
    <form
      class="setup"
      onsubmit={(e) => {
        e.preventDefault();
        void begin();
      }}
    >
      <div class="fields">
        <TextField
          bind:value={server}
          label={t('sync-server')}
          name="sync-server"
          placeholder="glaukopis.example.org"
          inputmode="url"
          spellcheck="false"
          autocapitalize="off"
          autocorrect="off"
          autocomplete="off"
          error={serverProblem}
          oninput={() => {
            found = null;
            serverProblem = null;
          }}
          onblur={look}
        >
          {#snippet trailing()}
            {#if found}<span class="found"><Check size={14} /></span>{/if}
          {/snippet}
        </TextField>
        <TextField
          bind:value={name}
          label={t('sync-computer-name')}
          name="sync-name"
          spellcheck="false"
          autocomplete="off"
        />
      </div>
      <div class="how">
        <Segmented
          bind:value={how}
          label={t('sync-how')}
          options={[
            { value: 'start', label: t('sync-how-start') },
            { value: 'join', label: t('sync-how-join') },
          ]}
          onchange={() => {
            passwordProblem = null;
            codeProblem = null;
          }}
        />
      </div>
      {#if (how === 'start' && passwordAsked) || how === 'join'}
        <div class="fields">
          {#if how === 'start'}
            <TextField
              bind:value={password}
              type="password"
              name="sync-password"
              label={t('sync-password')}
              error={passwordProblem}
              oninput={() => (passwordProblem = null)}
            />
          {:else}
            <TextField
              bind:value={code}
              label={t('sync-code')}
              name="sync-code"
              placeholder="XXXX-XXXX-XXXX"
              spellcheck="false"
              autocapitalize="characters"
              autocorrect="off"
              autocomplete="off"
              error={codeProblem}
              oninput={() => (codeProblem = null)}
            />
          {/if}
        </div>
      {/if}
      <div class="buttons">
        <Button type="submit" size="sm" variant="primary" disabled={busy || !ready} data-sync-begin>
          {#if how === 'start'}
            {busy ? t('sync-starting') : t('sync-start')}
          {:else}
            {busy ? t('sync-joining') : t('sync-join')}
          {/if}
        </Button>
      </div>
    </form>
  {:else}
    <div class="row">
      <div class="state">
        {#if well}
          <span class="mark ok"><Check size={13} /></span>
        {:else if status.state === 'working' || beginning}
          <span class="mark busy"><Spinner size={12} /></span>
        {:else}
          <span class="mark"><TriangleAlert size={13} /></span>
        {/if}
        <div class="what">
          <div class="label" data-sync-server>{host}</div>
          <div class="hint" data-sync-standing>{standing}</div>
          {#if status.problem}
            <p class="hint problem" data-sync-problem>{status.problem}</p>
          {/if}
        </div>
      </div>
      {#if !refused && !outdated}
        <div class="buttons">
          <Button
            size="sm"
            disabled={status.state === 'working'}
            onclick={() => sync.now()}
            data-sync-now
          >
            {#snippet icon()}<RefreshCw size={13} />{/snippet}
            {t('sync-now')}
          </Button>
        </div>
      {/if}
    </div>

    {#if !refused}
      <div class="computers">
        <h3 class="overline">{t('sync-computers')}</h3>
        {#if sync.home}
          <ul data-sync-computers>
            {#each devices as device (device.id)}
              <li data-sync-computer={device.name} data-sync-you={device.you ? '' : undefined}>
                <div class="what">
                  <div class="name">
                    {device.you ? t('sync-this-computer', { name: device.name }) : device.name}
                  </div>
                  {#if !device.you}
                    <div class="hint">{t('sync-seen', { when: when(device.lastSeen) })}</div>
                  {/if}
                </div>
                <Button size="sm" variant="ghost" onclick={() => rename(device)}>
                  {t('common-rename')}
                </Button>
                {#if !device.you}
                  <Button size="sm" variant="ghost" onclick={() => remove(device)}>
                    {t('common-remove')}
                  </Button>
                {/if}
              </li>
            {/each}
          </ul>
          {#if removeFailure}<p class="hint problem">{removeFailure}</p>{/if}
        {:else if sync.homeProblem !== null}
          <p class="hint problem" data-sync-computers-unread>
            {t('sync-computers-unread')}{#if sync.homeProblem}
              {' '}{sync.homeProblem}{/if}
          </p>
        {:else}
          <div class="waiting"><Spinner size={16} /></div>
        {/if}

        {#if sync.code}
          <div class="fresh">
            <div class="code" aria-label={t('sync-code')} data-sync-code>{sync.code.code}</div>
          </div>
          <p class="hint">{beforeJoin}<em>{t('sync-how-join')}</em>{afterJoin}</p>
        {/if}
        {#if codeFailure !== null}
          <p class="hint problem">
            {t('sync-code-failed')}{#if codeFailure}{' '}{codeFailure}{/if}
          </p>
        {/if}
        <div>
          <Button size="sm" disabled={making} onclick={makeCode} data-sync-add>
            {t('sync-add')}
          </Button>
        </div>
      </div>
    {/if}

    <div>
      <Button size="sm" variant="ghost" disabled={busy} onclick={stop} data-sync-stop>
        {t('sync-stop')}
      </Button>
    </div>
  {/if}
</section>

{#if renaming}
  <Dialog open title={t('sync-rename-title')} width={420} onclose={() => (renaming = null)}>
    <form
      onsubmit={(e) => {
        e.preventDefault();
        void commitRename();
      }}
    >
      <TextField
        bind:value={newName}
        label={t('sync-computer-name')}
        error={renameProblem}
        data-autofocus
        oninput={() => (renameProblem = null)}
      />
      <button type="submit" hidden aria-hidden="true" tabindex="-1"></button>
    </form>
    {#snippet footer()}
      <Button variant="ghost" onclick={() => (renaming = null)}>{t('common-cancel')}</Button>
      <Button variant="primary" disabled={busy || !newName.trim()} onclick={commitRename}>
        {t('common-rename')}
      </Button>
    {/snippet}
  </Dialog>
{/if}

<style>
  /* A section of the settings, as the others there are drawn. It is the
     container of what is made to fit below, which asks how wide the section
     is, not the window: the same section stands in the settings of a
     computer and on a phone's page. */
  .sync {
    container: sync / inline-size;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 26px 0;
    border-bottom: 1px solid var(--line);
  }
  h2 {
    font-family: var(--font-text);
    font-size: var(--text-xl);
    font-weight: 600;
    letter-spacing: -0.005em;
  }
  h3 {
    margin: 0;
  }
  .about {
    margin-top: -8px;
    color: var(--ink-2);
    line-height: 1.5;
  }
  .setup {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .found {
    display: inline-flex;
    color: var(--ok);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 12px 24px;
  }
  .state {
    display: flex;
    flex: 1;
    gap: 10px;
    align-items: flex-start;
    min-width: 0;
  }
  .what {
    flex: 1;
    min-width: 0;
  }
  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 20px;
    height: 20px;
    margin-top: 1px;
    border-radius: 50%;
    background: var(--gold-soft);
    color: var(--warn);
  }
  .mark.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .mark.busy {
    background: var(--paper-sunken);
    color: var(--ink-3);
  }
  .label,
  .name {
    font-weight: 550;
    overflow-wrap: anywhere;
  }
  .hint {
    margin-top: 2px;
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  /* What the core says may be several sentences, a line each. */
  .problem {
    color: var(--ink-2);
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
  .buttons {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
  .computers {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 0;
    min-height: 34px;
  }
  li + li {
    border-top: 1px solid var(--line);
  }
  .fresh {
    display: flex;
    align-items: center;
    padding: 12px 12px 12px 16px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--paper);
  }
  .code {
    flex: 1;
    min-width: 0;
    font-family: var(--font-mono);
    font-size: 19px;
    font-weight: 600;
    letter-spacing: 0.06em;
    overflow-wrap: anywhere;
    user-select: all;
  }
  .waiting {
    display: flex;
    padding: 6px 0;
  }

  /* Where the section is narrower than 520 pixels, as on a phone: the
     fields one under another, the name of a device over its buttons, and
     what is pressed at least 44 pixels high and wide, for a finger. The
     fields and the buttons of ui/ read their height from --control-h; the
     small buttons and the segmented control have a height of their own,
     which a least height here overrides. */
  @container sync (width < 520px) {
    .sync > * {
      --control-h: 44px;
    }
    .fields {
      grid-template-columns: minmax(0, 1fr);
    }
    .sync :global(.button) {
      min-width: 44px;
      min-height: 44px;
    }
    .sync :global(.segmented button) {
      min-height: 44px;
    }
    li {
      flex-wrap: wrap;
      row-gap: 2px;
    }
    li .what {
      flex: 1 1 100%;
    }
  }
</style>

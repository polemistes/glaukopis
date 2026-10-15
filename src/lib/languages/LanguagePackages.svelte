<script lang="ts">
  /**
   * The importing of languages of a kind from a server (ADR 0032), in the
   * settings of spelling and of OCR: a button, and the languages the server
   * offers, shown until they are closed. The server is the project's own
   * unless another is said; it may be a folder. The languages there are,
   * imported or of the system, are listed by the settings themselves.
   */
  import { onMount } from 'svelte';
  import {
    DEFAULT_LANGUAGES_SERVER,
    languagesInstall,
    languagesInstalled,
    languagesOffered,
    type InstalledLanguage,
    type LanguageKind,
    type LanguageOffer,
    type OfferedLanguage,
  } from '$lib/api/languages';
  import { languageName, languages, t } from '$lib/i18n';
  import { ocrLanguageName } from '$lib/ocr/languages';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { notifyError, notifyOk } from '$lib/ui/toast.svelte';

  interface Props {
    kind: LanguageKind;
    /** Told when a language has been imported or taken away. */
    onchanged: () => void;
  }

  let { kind, onchanged }: Props = $props();

  let installed = $state.raw<InstalledLanguage[]>([]);
  let offer = $state.raw<LanguageOffer | null>(null);
  /** The languages offered are shown. */
  let open = $state(false);
  let looking = $state(false);
  /** The name of the language being imported or taken away. */
  let busy = $state<string | null>(null);
  let changing = $state(false);
  let server = $state('');

  async function reload() {
    try {
      installed = (await languagesInstalled()).filter((l) => l.kind === kind);
    } catch (error) {
      notifyError(t('packages-list-failed'), error);
    }
  }

  onMount(reload);

  /** The name of a language, in the language of the interface. */
  function named(l: { kind: LanguageKind; name: string; language: string }): string {
    return l.kind === 'ocr' ? ocrLanguageName(l.name) : languageName(l.language || l.name);
  }

  const shownServer = $derived(settings.value.languagesServer || DEFAULT_LANGUAGES_SERVER);
  const offered = $derived(
    (offer?.packages ?? [])
      .filter((p) => p.kind === kind)
      .map((p) => ({ p, have: installed.find((i) => i.name === p.name) ?? null }))
      .sort((a, b) => named(a.p).localeCompare(named(b.p), languages.current)),
  );

  function megabytes(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return mb.toLocaleString(languages.current, { maximumFractionDigits: mb < 10 ? 1 : 0 });
  }

  async function look() {
    looking = true;
    try {
      await settings.saveNow();
      // What is imported may have been taken away in the list of the settings since.
      await reload();
      offer = await languagesOffered(null);
      open = true;
    } catch (error) {
      notifyError(t('packages-look-failed', { server: shownServer }), error);
    } finally {
      looking = false;
    }
  }

  async function done(imported: InstalledLanguage[]) {
    await reload();
    onchanged();
    const names = new Intl.ListFormat(languages.current, { type: 'conjunction' }).format(
      imported.map(named),
    );
    notifyOk(t('packages-imported', { count: imported.length, names }));
  }

  async function install(p: OfferedLanguage) {
    busy = p.name;
    try {
      await done(await languagesInstall(offer?.server ?? null, p));
    } catch (error) {
      notifyError(t('packages-import-failed', { name: named(p) }), error);
    } finally {
      busy = null;
    }
  }

  function change() {
    server = settings.value.languagesServer ?? '';
    changing = true;
  }

  function keepServer() {
    const clean = server.trim();
    settings.set('languagesServer', clean && clean !== DEFAULT_LANGUAGES_SERVER ? clean : null);
    changing = false;
    void look();
  }
</script>

<div class="packages" data-packages={kind}>
  {#if !open}
    <div class="actions">
      <Button size="sm" disabled={looking || busy !== null} onclick={look} data-import-languages>
        {looking
          ? t('packages-looking')
          : t(kind === 'spelling' ? 'packages-import-spelling' : 'packages-import-ocr')}
      </Button>
    </div>
  {/if}

  {#if open && offer}
    {#if offered.length}
      <ul class="offered" data-offered>
        {#each offered as { p, have } (p.name)}
          <li data-offered-name={p.name}>
            <span class="name">{named(p)}</span>
            <span class="meta">
              {t('packages-size', { size: megabytes(p.size) })}{p.licence ? ` · ${p.licence}` : ''}
            </span>
            {#if have && have.version === p.version}
              <span class="have">{t('packages-have')}</span>
            {:else}
              <Button size="sm" disabled={busy !== null} onclick={() => install(p)}>
                {busy === p.name
                  ? t('packages-importing')
                  : have
                    ? t('packages-update')
                    : t('packages-import')}
              </Button>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="none">{t('packages-none-offered')}</p>
    {/if}
  {/if}

  {#if open}
    <div class="server">
      {#if changing}
        <TextField
          bind:value={server}
          size="sm"
          placeholder={DEFAULT_LANGUAGES_SERVER}
          aria-label={t('packages-server-label')}
          spellcheck="false"
          onblur={keepServer}
          onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && keepServer()}
        />
      {:else}
        <span class="hint">{t('packages-server', { server: shownServer })}</span>
        <Button size="sm" variant="ghost" onclick={change}>{t('packages-server-change')}</Button>
      {/if}
    </div>
    <div class="actions">
      <Button size="sm" variant="ghost" onclick={() => (open = false)} data-close-languages>
        {t('common-close')}
      </Button>
    </div>
  {/if}
</div>

<style>
  .packages {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .hint {
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 34px;
    padding: 2px 6px 2px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
  }
  .name {
    flex: 1;
    min-width: 0;
  }
  .meta,
  .have {
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .actions,
  .server {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .server :global(.field) {
    flex: 1;
  }
  .none {
    color: var(--ink-3);
    font-style: italic;
  }
</style>

<script lang="ts">
  /**
   * The frame of the phone's page (stage 2 of
   * `docs/plans/an-app-for-android.md`): the place the steps name, and
   * nothing else of it kept alive; the toasts and the questions. It holds
   * what goes on whatever place is shown: the language, the look and the
   * ground behind the system's bars, what is written when the app leaves
   * the front and what is done when it comes back, and what changes on disk.
   */
  import { onMount, tick } from 'svelte';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { inTauri } from '$lib/api/backend';
  import { syncFront } from '$lib/api/sync';
  import { languageSet } from '$lib/api/system';
  import { pictures } from '$lib/figures/pictures.svelte';
  import { languageName, languages, load, t } from '$lib/i18n';
  import { theNotebook } from '$lib/notebook/open.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import { applyOwn, clearOwn, isDark } from '$lib/theme/own';
  import ConfirmHost from '$lib/ui/ConfirmHost.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import Toaster from '$lib/ui/Toaster.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import { followChanges } from './following';
  import { groundOf } from './ground';
  import { takeInbox } from './inbox';
  import NotesPlace from './NotesPlace.svelte';
  import NoteView from './NoteView.svelte';
  import { places } from './places.svelte';
  import SettingsPlace from './SettingsPlace.svelte';
  import { interfaceTag } from './starting';
  import TopBar from './TopBar.svelte';

  const notebook = $derived(theNotebook.current);
  const place = $derived(places.current);

  // ---- the language ----

  // The language chosen, or the system's: the core is told it, and its
  // words are loaded; the page speaks it once they are, and says why where
  // they do not come, staying in the one it was.
  $effect(() => {
    const tag = interfaceTag();
    document.documentElement.lang = tag;
    languageSet(tag).catch((error) => console.warn('The core was not told the language', error));
    load(tag).then(
      () => {
        if (interfaceTag() === tag) languages.current = tag;
      },
      (error) => {
        if (interfaceTag() === tag)
          notifyError(t('settings-language-error-load', { language: languageName(tag) }), error);
      },
    );
  });

  // The language new texts are given.
  $effect(() => {
    const chosen = settings.value.textLanguage;
    languages.newTexts = chosen && chosen !== 'system' ? chosen : languages.textDefault;
  });

  // Words the stylesheet shows where a figure has no element for them.
  $effect(() => {
    const root = document.documentElement.style;
    root.setProperty('--words-picture-absent', JSON.stringify(t('figures-picture-absent')));
    root.setProperty('--words-picture-caption', JSON.stringify(t('figures-caption-placeholder')));
  });

  // ---- the look ----

  // The theme in effect (the system's until one is chosen), its colours
  // where they are the writer's own, and the ground behind the system's
  // bars, as the browser works it out once the theme is on the page.
  $effect(() => {
    const theme = settings.theme;
    const own = settings.value.ownTheme;
    document.documentElement.dataset.theme = theme;
    if (theme === 'own') applyOwn(own);
    else clearOwn();
    const android = window.glaukopisAndroid;
    if (!android) return;
    const colour = groundOf();
    const dark = theme === 'dark' || (theme === 'own' && isDark(own));
    if (colour) {
      try {
        android.ground(colour, dark);
      } catch (error) {
        console.warn('Android was not told the ground of the page', error);
      }
    }
  });

  // ---- in front and not ----

  /** Whether the app has left the front. */
  let away = false;
  /** What is done as the app leaves the front and comes back, one after another, so that the engine is told in the order it happened. */
  let turns: Promise<void> = Promise.resolve();

  /**
   * The app leaves the front: what is not yet written of the notebook, the
   * settings, then the whole notebook, and only then the engine is told.
   * Android may end the app at any moment after.
   */
  function leave() {
    if (away) return;
    away = true;
    turns = turns.then(async () => {
      const nb = theNotebook.current;
      await nb?.flush().catch((error) => console.warn('The notebook was not written', error));
      await settings.flush().catch((error) => console.warn('The settings were not written', error));
      await nb?.snapshot().catch((error) => console.warn('The notebook was not saved', error));
      await syncFront(false).catch((error) =>
        console.warn('The synchronization was not told the app left the front', error),
      );
    });
  }

  /** The app comes back to the front: the engine told, the inbox taken in, the pictures not here tried again. */
  function come() {
    if (!away) return;
    away = false;
    turns = turns.then(async () => {
      await syncFront(true).catch((error) =>
        console.warn('The synchronization was not told the app is in front', error),
      );
      void takeInbox();
      void pictures.again();
    });
  }

  onMount(() => {
    const onvisibility = () => {
      if (document.visibilityState === 'hidden') leave();
      else come();
    };
    document.addEventListener('visibilitychange', onvisibility);
    window.addEventListener('pagehide', leave);
    return () => {
      document.removeEventListener('visibilitychange', onvisibility);
      window.removeEventListener('pagehide', leave);
    };
  });

  // What changes on disk: the references read again, the pictures tried again.
  onMount(() => followChanges());

  // On a computer the window, made hidden, is shown once the page is drawn;
  // on Android there is nothing to show.
  onMount(() => {
    if (!inTauri) return;
    void tick().then(() =>
      getCurrentWindow()
        .show()
        .catch(() => {}),
    );
  });
</script>

<div class="phone" data-phone-page>
  {#if place.at === 'notes'}
    <NotesPlace {notebook} />
  {:else if place.at === 'note'}
    {#key place.note}
      {#if notebook}
        <NoteView {notebook} id={place.note} fresh={place.fresh} />
      {:else}
        <section class="waiting">
          <TopBar back />
          <div class="centre"><Spinner size={22} /></div>
        </section>
      {/if}
    {/key}
  {:else}
    <SettingsPlace />
  {/if}
</div>
<Toaster />
<ConfirmHost />

<style>
  .phone {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    overflow: hidden;
    background: var(--paper);
  }
  .phone > :global(*) {
    flex: 1 1 auto;
    min-height: 0;
  }
  .waiting {
    display: flex;
    flex-direction: column;
  }
  .centre {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>

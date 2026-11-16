<script lang="ts">
  /**
   * Firefox in the settings (record 0102): whether Firefox is told of the
   * helper that takes what the plugin hands over, and setting it up or
   * removing it for this user. Where a package has put the file Firefox
   * reads in the system's place, for everyone on the computer, Firefox is
   * set up and there is nothing to press. Where the file names another
   * installation of Glaukopis, that is said, and Set up makes it this one,
   * for this user.
   */
  import { onMount } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { firefoxRemove, firefoxSetUp, firefoxSetup, type FirefoxSetup } from '$lib/api/notebook';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';

  /** What Firefox is told, once it has been read. */
  let setup = $state<FirefoxSetup | null>(null);
  let working = $state(false);

  onMount(() => {
    firefoxSetup()
      .then((found) => (setup = found))
      .catch((error) => notifyError(t('settings-firefox-unread'), error));
  });

  async function change(how: 'set-up' | 'remove') {
    working = true;
    try {
      setup = await (how === 'set-up' ? firefoxSetUp() : firefoxRemove());
    } catch (error) {
      notifyError(
        t(how === 'set-up' ? 'settings-firefox-not-set-up-error' : 'settings-firefox-not-removed'),
        error,
      );
    } finally {
      working = false;
    }
  }

  const standing = $derived(
    !setup ? null : setup.installed ? 'installed' : setup.other ? 'other' : 'none',
  );
</script>

<div
  class="firefox"
  data-firefox-setup={standing ?? ''}
  data-firefox-system={setup?.system ? '' : undefined}
>
  <div class="row">
    <div class="state">
      {#if standing === 'installed'}
        <span class="mark ok"><Check size={13} /></span>
      {:else if standing}
        <span class="mark"><TriangleAlert size={13} /></span>
      {:else}
        <span class="mark"></span>
      {/if}
      <div class="what">
        <div class="label">
          {#if standing === 'installed'}
            {t('settings-firefox-set-up')}
          {:else if standing === 'other'}
            {t('settings-firefox-other')}
          {:else}
            {t('settings-firefox-not-set-up')}
          {/if}
        </div>
        {#if setup && standing === 'other'}
          <div class="hint path-text" data-firefox-other>{setup.other}</div>
        {:else if setup && standing === 'installed'}
          <div class="hint path-text" data-firefox-manifest>{setup.manifest}</div>
        {/if}
      </div>
    </div>
    <div class="buttons">
      {#if standing && standing !== 'installed'}
        <Button
          size="sm"
          variant="primary"
          disabled={working}
          onclick={() => change('set-up')}
          data-firefox-set-up
        >
          {t('settings-firefox-set-up-button')}
        </Button>
      {/if}
      <!-- The system's file is the package's: it is not removed from here. -->
      {#if standing && standing !== 'none' && !setup?.system}
        <Button size="sm" disabled={working} onclick={() => change('remove')} data-firefox-remove>
          {t('settings-firefox-remove')}
        </Button>
      {/if}
    </div>
  </div>
</div>

<style>
  .firefox {
    display: flex;
    flex-direction: column;
    gap: 14px;
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
  .label {
    font-weight: 550;
  }
  .hint {
    margin-top: 2px;
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .path-text {
    font-family: var(--font-mono);
    color: var(--ink-2);
    overflow-wrap: anywhere;
    user-select: all;
  }
  .buttons {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
</style>

<script lang="ts">
  /**
   * The credits of Glaukopis: its own licence, then what it is built on,
   * the code taken into it, its fonts, its data, the programs it works
   * with, the icons and the owl, each with its licence and a link to the
   * project; and at the end the services references are looked up at, with
   * the words each asks to be thanked in. Opened from the About section of
   * the settings. The credits themselves are in `credits.ts`.
   */
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import { openPath } from '$lib/api/documents';
  import { lookupAcknowledgements } from '$lib/api/sources';
  import { t } from '$lib/i18n';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { CREDIT_GROUPS, OWN_LICENCE, isKey } from './credits';

  interface Props {
    onclose: () => void;
  }

  let { onclose }: Props = $props();

  /** What each service of the lookup asks to be thanked with. */
  let thanks = $state<{ service: string; words: string }[]>([]);

  $effect(() => {
    lookupAcknowledgements()
      .then((found) => (thanks = found))
      // The rest of the credits stand without them.
      .catch(() => {});
  });

  /** The words of a key of credits.ftl, or the plain words themselves. */
  const words = (s: string) => (isKey(s) ? t(s) : s);
</script>

<Dialog open title={t('credits-title')} width={620} tall {onclose}>
  <div class="credits selectable" data-credits>
    <p class="own" data-own-licence={OWN_LICENCE}>{t('credits-own-licence')}</p>

    {#each CREDIT_GROUPS as group (group.id)}
      <section data-credit-group={group.id}>
        <h3 class="overline">{t(`credits-group-${group.id}`)}</h3>
        <ul>
          {#each group.credits as credit (credit.name + credit.url)}
            <li data-credit={credit.name}>
              <button
                type="button"
                class="link"
                title={t('credits-open', { url: credit.url })}
                onclick={() => openPath(credit.url).catch(() => {})}
              >
                {words(credit.name)}
                <ExternalLink size={11} />
              </button>
              <p class="what">{words(credit.what)}</p>
              <p class="meta">
                <span class="licence">{credit.licence}</span>
                {#if credit.by}
                  <span class="by">{t('credits-by', { who: credit.by })}</span>
                {/if}
              </p>
            </li>
          {/each}
        </ul>
      </section>
    {/each}

    <section data-credit-group="lookup">
      <h3 class="overline">{t('credits-group-lookup')}</h3>
      <p class="what">{t('credits-lookup-about')}</p>
      {#each thanks as thank (thank.service)}
        <p class="what" data-thanks={thank.service}>{thank.words}</p>
      {/each}
    </section>
  </div>
</Dialog>

<style>
  .credits {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }
  .own {
    color: var(--ink-2);
    line-height: 1.5;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  ul {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--space-2) 0;
    border-top: 1px solid var(--line);
  }
  li:first-child {
    border-top: none;
    padding-top: 0;
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    align-self: flex-start;
    max-width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--accent-strong);
    font-weight: 600;
    text-align: left;
    overflow-wrap: anywhere;
    cursor: pointer;
  }
  .link:hover {
    text-decoration: underline;
  }
  .what {
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0 var(--space-3);
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
  .licence {
    font-variant-numeric: tabular-nums;
  }
</style>

<script lang="ts">
  /**
   * The trials of the page in view, under the text Tesseract read: the
   * newest first, each said by the settings it was read with and how sure
   * Tesseract was, the one shown marked. A click on one shows it; *Use these
   * settings* gives its settings to the pages selected. That is how one
   * sees whether a change helped or hurt, and goes back to the better one.
   */
  import { t } from '$lib/i18n';
  import type { PageSettings } from './plan';
  import { settingsSaid, type Trial } from './trials';

  interface Props {
    /** The page's trials, the newest first. */
    trials: Trial[];
    /** The trial shown in the pane. */
    shown: Trial | null;
    /** The name of a language, from Tesseract's name of it. */
    nameOf: (code: string) => string;
    onshow: (trial: Trial) => void;
    onsettings: (settings: PageSettings) => void;
  }

  let { trials, shown, nameOf, onshow, onsettings }: Props = $props();

  const uid = $props.id();

  /** Whether a trial is the one shown: the same page, tried at the same moment. */
  const isShown = (trial: Trial) =>
    !!shown && shown.at === trial.at && shown.tried.page === trial.tried.page;

  const confidenceOf = (trial: Trial) =>
    trial.tried.confidence == null ? null : Math.round(trial.tried.confidence);

  function onkeydown(event: KeyboardEvent, trial: Trial) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onshow(trial);
    }
  }
</script>

<div class="trials" data-trials={trials.length}>
  <h4 id="trials-{uid}">{t('ocr-trials')}</h4>
  <ul role="listbox" aria-labelledby="trials-{uid}">
    {#each trials as trial, i (i)}
      {@const selected = isShown(trial)}
      {@const confidence = confidenceOf(trial)}
      <li
        role="option"
        aria-selected={selected}
        tabindex="0"
        class:selected
        data-trial={i + 1}
        onclick={() => onshow(trial)}
        onkeydown={(e) => onkeydown(e, trial)}
      >
        <span class="said" title={settingsSaid(trial.settings, nameOf, t)}
          >{settingsSaid(trial.settings, nameOf, t)}</span
        >
        <span
          class="confidence"
          class:poorly={trial.tried.poorly}
          data-trial-confidence={confidence ?? ''}
        >
          {confidence == null ? t('ocr-trial-nothing') : t('ocr-trial-confidence', { confidence })}
        </span>
        <button
          type="button"
          class="use"
          data-trial-use
          onclick={(e) => {
            e.stopPropagation();
            onsettings({ ...trial.settings, languages: [...trial.settings.languages] });
          }}
        >
          {t('ocr-trial-use')}
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .trials {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 8px 8px;
  }
  h4 {
    margin: 0;
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  /* At most three rows in sight, the rest scrolled to: the text above keeps its room. */
  ul {
    display: flex;
    flex-direction: column;
    gap: 1px;
    max-height: calc(3 * 2.6em);
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }
  /* A row: its settings, on two lines at the most, how sure, and the way to read so again. */
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: baseline;
    gap: 0 10px;
    flex: none;
    padding: 3px 8px;
    border-radius: var(--radius-s);
    border-left: 2px solid transparent;
    font-size: var(--text-sm);
    color: var(--ink-2);
    cursor: pointer;
  }
  li:hover {
    background: var(--paper-hover);
  }
  li:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  li.selected {
    background: var(--accent-softer);
    border-left-color: var(--accent);
    color: var(--ink);
  }
  .said {
    display: -webkit-box;
    min-width: 0;
    overflow: hidden;
    overflow-wrap: anywhere;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  .confidence {
    font-variant-numeric: tabular-nums;
    color: var(--ink-2);
    white-space: nowrap;
  }
  .confidence.poorly {
    color: var(--warn);
    font-weight: 550;
  }
  .use {
    justify-self: end;
    margin: 0;
    padding: 1px 4px;
    border: 0;
    border-radius: var(--radius-s);
    background: none;
    color: var(--accent-strong);
    font: inherit;
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .use:hover {
    text-decoration: underline;
  }
  .use:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
</style>

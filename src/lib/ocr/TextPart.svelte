<script lang="ts">
  /**
   * What becomes of the text a PDF has, where it has any (ADR 0044): what was
   * found, said in a line (on how many pages, in which fonts, and which
   * schemes keep its letters), and three choices, the same wherever a PDF is
   * read: keep it as it is; translate it, where a scheme applies; or read
   * every page anew with Tesseract, the PDF's text taken from no page.
   */
  import type { Looked, Scheme, TextChoice } from '$lib/api/ocr';
  import { t } from '$lib/i18n';

  interface Props {
    looked: Looked;
    choice: TextChoice;
    /** For a PDF made searchable: translating puts its own tables right, reading anew takes its unseen text away. */
    searchable?: boolean;
    /** Whether Tesseract is there to read pages anew. */
    canRead?: boolean;
  }

  let { looked, choice = $bindable(), searchable = false, canRead = true }: Props = $props();

  const name = `ocr-text-${Math.random().toString(36).slice(2)}`;

  /** Names in a sentence: the first three, and how many more. */
  function named(fonts: string[]): string {
    if (fonts.length <= 3) return fonts.join(', ');
    return t('ocr-text-fonts-more', {
      fonts: fonts.slice(0, 3).join(', '),
      count: fonts.length - 3,
    });
  }

  const schemeWords: Record<Scheme, string> = {
    'greek-names': 'ocr-text-scheme-greek-names',
    'expert-names': 'ocr-text-scheme-expert-names',
    'beta-code': 'ocr-text-scheme-beta-code',
  };
</script>

<fieldset class="choice" data-text-choice>
  <legend>{t('ocr-text-title')}</legend>
  <p class="facts" data-text-found>
    {looked.fonts.length
      ? t('ocr-text-found', {
          withText: looked.withText,
          pages: looked.pages,
          fonts: named(looked.fonts),
        })
      : t('ocr-text-found-no-fonts', { withText: looked.withText, pages: looked.pages })}
  </p>
  {#each looked.schemes as found (found.scheme)}
    <p class="scheme" data-text-scheme={found.scheme}>
      {t(schemeWords[found.scheme], { fonts: named(found.fonts), pages: found.pages })}
    </p>
  {/each}
  {#if looked.poor > 0}
    <p class="poor" data-text-poor>
      {t(looked.poor >= looked.withText ? 'ocr-text-poor-all' : 'ocr-text-poor', {
        poor: looked.poor,
        pages: looked.withText,
      })}
    </p>
  {/if}
  <label class="option">
    <input
      type="radio"
      {name}
      data-choice="keep"
      checked={choice === 'keep'}
      onchange={() => (choice = 'keep')}
    />
    <span>
      {t('ocr-text-keep')}
      <small>{t(searchable ? 'ocr-text-keep-searchable-hint' : 'ocr-text-keep-hint')}</small>
    </span>
  </label>
  {#if looked.schemes.length}
    <label class="option">
      <input
        type="radio"
        {name}
        data-choice="translate"
        checked={choice === 'translate'}
        onchange={() => (choice = 'translate')}
      />
      <span>
        {t('ocr-text-translate')}
        <small>
          {t(searchable ? 'ocr-text-translate-searchable-hint' : 'ocr-text-translate-hint')}
        </small>
      </span>
    </label>
  {/if}
  <label class="option" class:off={!canRead}>
    <input
      type="radio"
      {name}
      data-choice="anew"
      checked={choice === 'anew'}
      disabled={!canRead}
      onchange={() => (choice = 'anew')}
    />
    <span>
      {t('ocr-text-anew')}
      <small>
        {canRead
          ? t(searchable ? 'ocr-text-anew-searchable-hint' : 'ocr-text-anew-hint')
          : t('ocr-text-anew-no-tesseract')}
      </small>
    </span>
  </label>
</fieldset>

<style>
  .choice {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  legend {
    padding: 0;
    margin-bottom: var(--space-2);
    font-weight: 550;
    color: var(--ink);
  }
  .facts,
  .scheme {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .scheme {
    padding: 8px 10px;
    border-radius: var(--radius-m);
    background: var(--accent-softer);
    color: var(--ink);
  }
  .poor {
    margin: 0;
    padding: 8px 10px;
    border-radius: var(--radius-m);
    background: var(--gold-soft);
    color: var(--ink);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .option {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    color: var(--ink-2);
    cursor: pointer;
  }
  .option.off {
    cursor: default;
    opacity: 0.6;
  }
  .option input {
    accent-color: var(--accent);
    margin: 3px 0 0;
  }
  .option span {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  small {
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
</style>

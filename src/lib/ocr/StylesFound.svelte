<script lang="ts">
  /**
   * The styles of text found to recur beside the body of a PDF whose shape
   * was kept (ADR 0045), shown after the reading for the one who brings it
   * in to say what each is: a sample of each in its look, how often it
   * occurs and on how many pages, and a choice of text (where nothing is
   * said), a kind of paragraph of the catalogue, or a kind of their own,
   * whose name is guessed at first from the look in words. Nothing is
   * guessed of what a style means. What is chosen is kept in `choices`, by
   * the number of the style, for `makeImported`. In the dialog of documents
   * brought in and in that of a PDF of the library made into elements.
   */
  import type { SvelteMap } from 'svelte/reactivity';
  import type { StyleFoundView } from '$lib/api/imported';
  import { t } from '$lib/i18n';
  import type { StyleChoice } from '$lib/project/model/import';
  import Select from '$lib/ui/Select.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { lookInWords, OWN, styleOptions } from './styles';

  interface Props {
    styles: StyleFoundView[];
    /** What each style was said to be, by its number; a style not in it is text. */
    choices: SvelteMap<number, StyleChoice>;
    disabled?: boolean;
  }

  let { styles, choices, disabled = false }: Props = $props();

  const options = $derived(styleOptions());

  function valueOf(id: number): string {
    const choice = choices.get(id);
    if (!choice) return 'text';
    return 'own' in choice ? OWN : choice.kind;
  }

  function choose(style: StyleFoundView, value: string) {
    if (value === OWN) choices.set(style.id, { own: lookInWords(style) });
    else if (value === 'text') choices.delete(style.id);
    else choices.set(style.id, { kind: value });
  }

  /** The style's own font where the machine has it, the text's otherwise; a name that could break out of the rule is not taken. */
  function fontOf(style: StyleFoundView): string | undefined {
    const family = style.family.replace(/["\\;{}<>]/g, '').trim();
    return family ? `"${family}", var(--font-text)` : undefined;
  }

  /** The sample's size beside the body's, within what can be read in a row. */
  const sizeOf = (style: StyleFoundView) =>
    `${Math.min(1.5, Math.max(0.72, style.size || 1)).toFixed(2)}em`;
</script>

<section class="styles" data-styles-found>
  <div class="overline">{t('ocr-styles-title')}</div>
  <p class="about">{t('ocr-styles-about', { count: styles.length })}</p>
  {#each styles as style (style.id)}
    {@const choice = choices.get(style.id)}
    <div class="style" data-style={style.id}>
      <p
        class="sample"
        class:kept={style.kept}
        class:indent={style.indent}
        style:font-family={fontOf(style)}
        style:font-size={sizeOf(style)}
        style:font-style={style.italic ? 'italic' : undefined}
        style:font-weight={style.bold ? 650 : undefined}
        data-style-sample
      >
        {style.sample}
      </p>
      <div class="choice">
        <div class="often" data-style-often>
          {t('ocr-styles-often', { count: style.count, pages: style.pages })}
        </div>
        <Select
          value={valueOf(style.id)}
          {options}
          size="sm"
          {disabled}
          onchange={(value) => choose(style, value)}
        />
      </div>
      {#if choice && 'own' in choice}
        <div class="name">
          <TextField
            value={choice.own}
            label={t('ocr-styles-own-name')}
            hint={t('ocr-styles-own-hint')}
            size="sm"
            {disabled}
            data-style-name
            oninput={(e) => choices.set(style.id, { own: e.currentTarget.value })}
          />
        </div>
      {/if}
    </div>
  {/each}
</section>

<style>
  .styles {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }
  .about {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-2);
    line-height: 1.45;
  }
  .style {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 190px;
    gap: 8px 14px;
    align-items: start;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
  }
  @media (max-width: 520px) {
    .style {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .sample {
    margin: 0;
    font-family: var(--font-text);
    color: var(--ink);
    line-height: 1.4;
    overflow-wrap: anywhere;
    max-height: 7.2em;
    overflow: hidden;
  }
  /* Lines kept as lines stand as the page had them. */
  .sample.kept {
    white-space: pre-line;
  }
  .sample.indent {
    text-indent: 1.5em;
  }
  .choice {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .often {
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .name {
    grid-column: 1 / -1;
  }
</style>

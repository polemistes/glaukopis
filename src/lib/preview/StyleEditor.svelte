<script lang="ts">
  import { untrack } from 'svelte';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import {
    styleSample,
    stylesDelete,
    stylesRead,
    stylesSave,
    type ExportReference,
  } from '$lib/api/documents';
  import { libraryGetMany } from '$lib/api/library';
  import { languageName, primary, t } from '$lib/i18n';
  import { library, sortEntries } from '$lib/state/library.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openMenu } from '$lib/ui/menu.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyOk } from '$lib/ui/toast.svelte';
  import * as csl from './csl';
  import { documents } from './documents.svelte';

  interface Props {
    /** The style to begin from. */
    id: string;
    /** Ids of references to show the style on: those of the project. */
    references?: string[];
    language?: string;
    onsaved: (id: string) => void;
    onclose: () => void;
  }

  let { id, references = [], language, onsaved, onclose }: Props = $props();

  let style = $state.raw<csl.Style | null>(null);
  /** Rises with every change to the style, which is changed in place. */
  let version = $state(0);
  let original = '';
  let name = $state('');
  let own = $state(false);
  let depth = $state<'options' | 'parts' | 'source'>('options');
  let scope = $state<csl.Scope>('citation');
  let error = $state<string | null>(null);
  let saving = $state(false);

  let source = $state('');
  let sourceError = $state<string | null>(null);

  let sample = $state.raw<{ citations: string[]; bibliography: string[] } | null>(null);
  let sampleError = $state<string | null>(null);
  let sampling = $state(false);
  let works = $state.raw<ExportReference[]>([]);
  let round = 0;

  let selected = $state.raw<Element | null>(null);
  let open = $state(new Set<Element>());

  const xml = $derived.by(() => {
    void version;
    return style ? csl.serialise(style) : '';
  });
  const changed = $derived(!!style && xml !== original);
  const kind = $derived.by(() => {
    void version;
    return style ? csl.kind(style) : '';
  });
  const hasBibliography = $derived.by(() => {
    void version;
    return !!style && !!csl.scopeElement(style, 'bibliography');
  });

  $effect(() => {
    const wanted = id;
    untrack(async () => {
      try {
        const text = await stylesRead(wanted);
        const parsed = csl.parse(text);
        style = parsed;
        original = csl.serialise(parsed);
        const summary = documents.style(wanted);
        own = summary?.own ?? false;
        const title = csl.title(parsed) || summary?.title || wanted;
        name = own ? title : t('style-name-changed', { name: title });
        version++;
      } catch (e) {
        error = describeError(e) ?? t('style-read-failed');
      }
      await pickWorks();
    });
  });

  /** A few works of different kinds to show the style on: the project's, or the library's. */
  async function pickWorks() {
    await library.load();
    const wanted: string[] = [];
    const kinds = new Set<string>();
    const pool = [
      ...references.map((r) => library.get(r)).filter((e) => !!e),
      ...sortEntries(library.entries, 'added', true),
    ];
    for (const entry of pool) {
      if (!entry || wanted.includes(entry.id)) continue;
      // One of each kind first.
      if (kinds.has(entry.type) && wanted.length < 4 && pool.length > 8) continue;
      kinds.add(entry.type);
      wanted.push(entry.id);
      if (wanted.length >= 5) break;
    }
    if (wanted.length) {
      try {
        const full = await libraryGetMany(wanted);
        works = full.map((r) => ({
          id: r.id,
          key: r.key,
          type: r.type,
          fields: r.fields,
          names: r.names,
        }));
        return;
      } catch {
        // The examples below serve.
      }
    }
    works = EXAMPLES;
  }

  const EXAMPLES: ExportReference[] = [
    {
      id: 'example-1',
      key: 'nagy1979',
      type: 'book',
      fields: {
        title: 'The Best of the {Achaeans}',
        subtitle: 'Concepts of the Hero in Archaic {Greek} Poetry',
        publisher: 'Johns Hopkins University Press',
        location: 'Baltimore',
        date: '1979',
      },
      names: { author: [{ family: 'Nagy', given: 'Gregory' }] },
    },
    {
      id: 'example-2',
      key: 'west1988',
      type: 'article',
      fields: {
        title: 'The Rise of the {Greek} Epic',
        journaltitle: 'Journal of Hellenic Studies',
        volume: '108',
        date: '1988',
        pages: '151–172',
        doi: '10.2307/632637',
      },
      names: { author: [{ family: 'West', given: 'M. L.' }] },
    },
    {
      id: 'example-3',
      key: 'foley2004',
      type: 'incollection',
      fields: {
        title: 'Epic as Genre',
        booktitle: 'The {Cambridge} Companion to {Homer}',
        publisher: 'Cambridge University Press',
        location: 'Cambridge',
        date: '2004',
        pages: '171–187',
      },
      names: {
        author: [{ family: 'Foley', given: 'John Miles' }],
        editor: [{ family: 'Fowler', given: 'Robert' }],
      },
    },
    {
      id: 'example-4',
      key: 'hornblower2012',
      type: 'collection',
      fields: {
        title: 'The {Oxford} Classical Dictionary',
        edition: '4',
        publisher: 'Oxford University Press',
        location: 'Oxford',
        date: '2012',
      },
      names: {
        editor: [
          { family: 'Hornblower', given: 'Simon' },
          { family: 'Spawforth', given: 'Antony' },
          { family: 'Eidinow', given: 'Esther' },
        ],
      },
    },
  ];

  // The sample follows the changes, a moment behind.
  $effect(() => {
    const text = xml;
    const list = works;
    if (!text || !list.length) return;
    const timer = setTimeout(() => untrack(() => show(text, list)), sample ? 500 : 50);
    return () => clearTimeout(timer);
  });

  async function show(text: string, list: ExportReference[]) {
    const mine = ++round;
    sampling = true;
    try {
      const html = await styleSample(text, list, language);
      if (mine !== round) return;
      sample = read(html);
      sampleError = null;
    } catch (e) {
      if (mine === round) sampleError = describeError(e) ?? t('style-sample-failed');
    } finally {
      if (mine === round) sampling = false;
    }
  }

  const ALLOWED = new Set([
    'I',
    'EM',
    'B',
    'STRONG',
    'SPAN',
    'SUP',
    'SUB',
    'DIV',
    'P',
    'A',
    'BR',
    'U',
    'S',
  ]);

  /** Takes from what Pandoc made only what type can look like: no scripts, no addresses. */
  function clean(node: Node, into: Node, doc: Document) {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        into.appendChild(doc.createTextNode(child.textContent ?? ''));
      } else if (child instanceof Element) {
        if (!ALLOWED.has(child.tagName)) {
          clean(child, into, doc);
          continue;
        }
        const el = doc.createElement(child.tagName === 'A' ? 'span' : child.tagName.toLowerCase());
        // Only the classes that mean something here; above all not that of a
        // citation, which the text editor shows in a form of its own.
        const cls = (child.getAttribute('class') ?? '')
          .split(/\s+/)
          .filter((c) => /^(csl-[\w-]+|gk-note|smallcaps)$/.test(c))
          .join(' ');
        if (cls) el.setAttribute('class', cls);
        clean(child, el, doc);
        into.appendChild(el);
      }
    }
  }

  function read(html: string) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const inner = (el: Element): string => {
      const holder = document.createElement('div');
      clean(el, holder, document);
      return holder.innerHTML;
    };
    const citations = Array.from(doc.querySelectorAll('[id^="gk-sample-"]')).map((el) => {
      const p = el.querySelector('p') ?? el;
      return inner(p);
    });
    const bibliography = Array.from(doc.querySelectorAll('#refs .csl-entry')).map(inner);
    return { citations, bibliography };
  }

  const captions = $derived([
    t('style-sample-cited'),
    t('style-sample-same-page'),
    t('style-sample-another'),
    t('style-sample-first-again'),
    t('style-sample-together'),
    t('style-sample-in-sentence'),
  ]);

  function touch() {
    version++;
  }

  // ---- saving ----

  async function save() {
    if (!style || saving) return;
    if (depth === 'source' && !applySource()) return;
    saving = true;
    error = null;
    try {
      const saved = await stylesSave(own ? id : '', name.trim(), csl.serialise(style));
      await documents.reload();
      notifyOk(t('style-saved', { name: saved.title }));
      onsaved(saved.id);
    } catch (e) {
      error = describeError(e) ?? t('style-save-failed');
    } finally {
      saving = false;
    }
  }

  async function removeStyle() {
    const ok = await confirm({
      title: t('style-delete-title', { name }),
      message: t('style-delete-message'),
      confirm: t('style-delete-confirm'),
      danger: true,
    });
    if (!ok) return;
    try {
      await stylesDelete(id);
      await documents.reload();
      onsaved('');
    } catch (e) {
      error = describeError(e) ?? t('style-delete-failed');
    }
  }

  async function close() {
    if (changed) {
      const ok = await confirm({
        title: t('style-leave-title'),
        message: t('style-leave-message'),
        confirm: t('style-leave-confirm'),
        cancel: t('style-leave-cancel'),
      });
      if (!ok) return;
    }
    onclose();
  }

  // ---- the source ----

  function toDepth(next: typeof depth) {
    if (depth === 'source' && next !== 'source' && !applySource()) return;
    if (next === 'source') {
      source = pretty(xml);
      sourceError = null;
    }
    depth = next;
  }

  function applySource(): boolean {
    try {
      const parsed = csl.parse(source);
      style = parsed;
      selected = null;
      open = new Set();
      sourceError = null;
      touch();
      return true;
    } catch (e) {
      sourceError = describeError(e) ?? t('style-source-unread');
      return false;
    }
  }

  /** Breaks the source into lines where the serialiser left none. */
  function pretty(text: string): string {
    if (text.split('\n').length > 20) return text;
    let depthNow = 0;
    return text
      .replace(/>\s*</g, '>\n<')
      .split('\n')
      .map((line) => {
        if (/^<\//.test(line)) depthNow = Math.max(0, depthNow - 1);
        const out = '  '.repeat(depthNow) + line;
        if (/^<[^!?/][^>]*[^/]>$/.test(line) && !/<\/[^>]+>$/.test(line)) depthNow++;
        return out;
      })
      .join('\n');
  }

  // ---- options ----

  function attr(el: Element | null, a: string): string {
    void version;
    return el?.getAttribute(a) ?? '';
  }

  function setAttr(el: Element | null, a: string, value: string | null) {
    if (!el) return;
    csl.set(el, a, value === '' ? null : value);
    touch();
  }

  function nameOpt(a: string): string {
    void version;
    return style ? (csl.nameOption(style, scope, a) ?? '') : '';
  }

  function setNameOpt(a: string, value: string | null) {
    if (!style) return;
    csl.setNameOption(style, scope, a, value === '' ? null : value);
    touch();
  }

  const scopeEl = $derived.by(() => {
    void version;
    return style ? csl.scopeElement(style, scope) : null;
  });
  const layoutEl = $derived.by(() => {
    void version;
    return style ? csl.layout(style, scope) : null;
  });

  const initials = $derived.by(() => {
    void version;
    return style ? csl.initials(style, scope) : 'full';
  });

  function setInitials(value: string) {
    if (!style) return;
    csl.setInitials(style, scope, value as csl.Initials);
    touch();
  }

  // ---- parts ----

  interface Row {
    el: Element;
    depth: number;
    words: string;
    form: string;
    parts: number;
    /** Set for what lies within a macro: changes there show wherever the macro is used. */
    within: string | null;
  }

  const rows = $derived.by(() => {
    void version;
    const out: Row[] = [];
    if (!style || !layoutEl) return out;
    const s = style;
    const walk = (el: Element, d: number, within: string | null, trail: Set<string>) => {
      const kids = csl.partsOf(s, el);
      out.push({
        el,
        depth: d,
        words: csl.describe(el),
        form: csl.formWords(el),
        parts: kids.length,
        within,
      });
      if (!open.has(el)) return;
      const called = el.localName === 'text' ? el.getAttribute('macro') : null;
      if (called && trail.has(called)) return;
      const next = called ? new Set([...trail, called]) : trail;
      for (const k of kids) walk(k, d + 1, called ?? within, next);
    };
    walk(layoutEl, 0, null, new Set());
    return out;
  });

  $effect(() => {
    // The whole is open from the start, and what it holds directly.
    if (!layoutEl || !style) return;
    const l = layoutEl;
    const s = style;
    untrack(() => {
      if (open.has(l)) return;
      const next = new Set(open);
      next.add(l);
      for (const k of csl.partsOf(s, l)) if (k.localName === 'group') next.add(k);
      open = next;
    });
  });

  function toggle(el: Element) {
    const next = new Set(open);
    if (next.has(el)) next.delete(el);
    else next.add(el);
    open = next;
  }

  function addPart(event: MouseEvent, at: Element, inside: boolean) {
    if (!style) return;
    const s = style;
    const put = (part: csl.NewPart) => {
      const made = csl.add(s, at, part, inside);
      if (inside) open = new Set([...open, at]);
      selected = made;
      touch();
    };
    openMenu(
      event.currentTarget as HTMLElement,
      [
        {
          label: t('style-add-words'),
          hint: t('style-add-words-hint'),
          action: () => put({ kind: 'value', text: '' }),
        },
        { kind: 'separator' },
        { kind: 'heading', label: t('style-add-from-reference') },
        ...csl.TEXT_VARIABLES.map((v) => ({
          label: csl.variableName(v).replace(/^./, (c) => c.toUpperCase()),
          action: () => put({ kind: 'variable', name: v }),
        })),
      ],
      { align: 'start' },
    );
  }

  const selectedWithin = $derived(rows.find((r) => r.el === selected)?.within ?? null);
  const uses = $derived.by(() => {
    void version;
    return style && selectedWithin ? csl.usesOf(style, selectedWithin) : 0;
  });

  const selects: Record<string, [string, string][]> = $derived({
    'font-style': [
      ['', t('style-slant-upright')],
      ['italic', t('style-slant-italic')],
    ],
    'font-weight': [
      ['', t('style-weight-regular')],
      ['bold', t('style-weight-bold')],
    ],
    'font-variant': [
      ['', t('style-letters-as-written')],
      ['small-caps', t('style-letters-small-caps')],
    ],
    'text-case': [
      ['', t('style-case-as-entered')],
      ['title', t('style-case-title')],
      ['sentence', t('style-case-sentence')],
      ['capitalize-first', t('style-case-capitalize-first')],
      ['capitalize-all', t('style-case-capitalize-all')],
      ['uppercase', t('style-case-uppercase')],
      ['lowercase', t('style-case-lowercase')],
    ],
    'vertical-align': [
      ['', t('style-height-baseline')],
      ['sup', t('style-height-raised')],
      ['sub', t('style-height-lowered')],
    ],
  });

  /** The languages CSL has words in that a style can be set to, as `default-locale` names them. */
  const LOCALES = [
    'en-GB',
    'en-US',
    'nb-NO',
    'nn-NO',
    'da-DK',
    'sv-SE',
    'de-DE',
    'fr-FR',
    'it-IT',
    'es-ES',
    'el-GR',
  ];
  /** Named by the system, by the language alone where no other in the list shares it. */
  const locales = $derived(
    LOCALES.map((tag): [string, string] => {
      const alone = LOCALES.filter((other) => primary(other) === primary(tag)).length === 1;
      return [tag, languageName(alone ? primary(tag) : tag)];
    }),
  );

  /**
   * A sentence with fields in it, as the language orders it: its words, and
   * between them the fields, by name. The message is given marks for the
   * fields that no words have, and is cut at them.
   */
  function sentence(
    say: (marks: Record<string, string>) => string,
    fields: string[],
  ): { words: string; field?: string }[] {
    const marks = Object.fromEntries(fields.map((f, i) => [f, `\u{E000}${i}\u{E001}`]));
    return say(marks)
      .split(/\u{E000}(\d+)\u{E001}/u)
      .map((part, i) => (i % 2 ? { words: '', field: fields[Number(part)] } : { words: part }));
  }
</script>

{#snippet pick(
  label: string,
  value: string,
  set: (v: string) => void,
  options: [string, string][],
  hint = '',
)}
  <label class="row">
    <span class="what"
      >{label}{#if hint}<small>{hint}</small>{/if}</span
    >
    <select {value} onchange={(e) => set(e.currentTarget.value)}>
      {#each options as [v, words] (v)}<option value={v}>{words}</option>{/each}
      {#if !options.some(([v]) => v === value)}<option {value}>{value}</option>{/if}
    </select>
  </label>
{/snippet}

{#snippet words(
  label: string,
  value: string,
  set: (v: string) => void,
  hint = '',
  placeholder = '',
)}
  <label class="row">
    <span class="what"
      >{label}{#if hint}<small>{hint}</small>{/if}</span
    >
    <input
      class="literal"
      {value}
      {placeholder}
      spellcheck="false"
      oninput={(e) => set(e.currentTarget.value)}
    />
  </label>
{/snippet}

{#snippet count(label: string, value: string, set: (v: string) => void, hint = '')}
  <label class="row">
    <span class="what"
      >{label}{#if hint}<small>{hint}</small>{/if}</span
    >
    <input
      class="short"
      type="number"
      min="0"
      max="99"
      {value}
      placeholder="—"
      oninput={(e) => set(e.currentTarget.value)}
    />
  </label>
{/snippet}

{#snippet yes(label: string, value: string, set: (v: string) => void, hint = '')}
  <label class="row check">
    <span class="what"
      >{label}{#if hint}<small>{hint}</small>{/if}</span
    >
    <input
      type="checkbox"
      checked={value === 'true'}
      onchange={(e) => set(e.currentTarget.checked ? 'true' : '')}
    />
  </label>
{/snippet}

<Dialog
  open
  title={t('style-editor')}
  width={1180}
  tall
  padded={false}
  dismissable={false}
  onclose={close}
>
  {#snippet header()}
    <div class="head">
      <h2>{t('style-editor')}</h2>
      <input
        class="name"
        bind:value={name}
        aria-label={t('style-name')}
        placeholder={t('style-name')}
      />
    </div>
  {/snippet}

  {#if !style}
    <div class="centre">
      {#if error}<p class="error selectable">{error}</p>{:else}<Spinner size={22} />{/if}
    </div>
  {:else}
    <div class="editor">
      <div class="left-side">
        <div class="bar">
          <Segmented
            value={depth}
            label={t('style-depth')}
            options={[
              { value: 'options', label: t('style-depth-options') },
              { value: 'parts', label: t('style-depth-parts') },
              { value: 'source', label: t('style-depth-source') },
            ]}
            onchange={toDepth}
          />
          {#if depth !== 'source' && hasBibliography}
            <Segmented
              bind:value={scope}
              label={t('style-scope')}
              options={[
                {
                  value: 'citation',
                  label: kind === 'note' ? t('style-scope-notes') : t('style-scope-citations'),
                },
                { value: 'bibliography', label: t('style-scope-bibliography') },
              ]}
              onchange={() => (selected = null)}
            />
          {/if}
        </div>

        {#if error}<p class="error selectable" role="alert">{error}</p>{/if}

        {#if depth === 'options'}
          <div class="form">
            <h3>{t('style-names')}</h3>
            <div class="row sentence">
              <span class="what">
                {#each sentence((marks) => t('style-et-al', marks), ['min', 'first']) as piece, i (i)}
                  {#if piece.field === 'min'}
                    <input
                      class="inline"
                      type="number"
                      min="1"
                      max="99"
                      placeholder="—"
                      value={nameOpt('et-al-min')}
                      oninput={(e) => setNameOpt('et-al-min', e.currentTarget.value)}
                      aria-label={t('style-et-al-min')}
                    />
                  {:else if piece.field === 'first'}
                    <input
                      class="inline"
                      type="number"
                      min="1"
                      max="99"
                      placeholder="—"
                      value={nameOpt('et-al-use-first')}
                      oninput={(e) => setNameOpt('et-al-use-first', e.currentTarget.value)}
                      aria-label={t('style-et-al-first')}
                    />
                  {:else}{piece.words}{/if}
                {/each}
                <small>{t('style-et-al-empty')}</small>
              </span>
            </div>
            {#if scope === 'citation'}
              <div class="row sentence">
                <span class="what">
                  {#each sentence((marks) => t('style-et-al-again', marks), ['min', 'first']) as piece, i (i)}
                    {#if piece.field === 'min'}
                      <input
                        class="inline"
                        type="number"
                        min="1"
                        max="99"
                        placeholder="—"
                        value={nameOpt('et-al-subsequent-min')}
                        oninput={(e) => setNameOpt('et-al-subsequent-min', e.currentTarget.value)}
                        aria-label={t('style-et-al-again-min')}
                      />
                    {:else if piece.field === 'first'}
                      <input
                        class="inline"
                        type="number"
                        min="1"
                        max="99"
                        placeholder="—"
                        value={nameOpt('et-al-subsequent-use-first')}
                        oninput={(e) =>
                          setNameOpt('et-al-subsequent-use-first', e.currentTarget.value)}
                        aria-label={t('style-et-al-again-first')}
                      />
                    {:else}{piece.words}{/if}
                  {/each}
                  <small>{t('style-et-al-again-empty')}</small>
                </span>
              </div>
            {/if}
            {@render pick(
              t('style-before-last-name'),
              nameOpt('and'),
              (v) => setNameOpt('and', v),
              [
                ['text', t('style-and-word')],
                ['symbol', '&'],
                ['', t('style-and-nothing')],
              ],
            )}
            {@render pick(
              t('style-comma-before-last'),
              nameOpt('delimiter-precedes-last'),
              (v) => setNameOpt('delimiter-precedes-last', v),
              [
                ['', t('style-as-the-style-has-it')],
                ['contextual', t('style-comma-contextual')],
                ['always', t('style-comma-always')],
                ['never', t('style-comma-never')],
                ['after-inverted-name', t('style-comma-after-inverted')],
              ],
            )}
            {@render pick(t('style-given-names'), initials, setInitials, [
              ['full', t('style-given-full')],
              ['spaced', t('style-given-spaced')],
              ['close', t('style-given-close')],
              ['bare', t('style-given-bare')],
              ['bare-spaced', t('style-given-bare-spaced')],
            ])}
            {@render pick(
              t('style-family-first'),
              nameOpt('name-as-sort-order'),
              (v) => setNameOpt('name-as-sort-order', v),
              [
                ['', t('style-family-first-none')],
                ['first', t('style-family-first-first')],
                ['all', t('style-family-first-all')],
              ],
            )}
            {@render words(
              t('style-sort-separator'),
              nameOpt('sort-separator'),
              (v) => setNameOpt('sort-separator', v),
              t('style-sort-separator-hint'),
              ', ',
            )}

            {#if scope === 'citation'}
              <h3>{kind === 'note' ? t('style-the-note') : t('style-the-citation')}</h3>
              {@render words(
                t('style-begins-with'),
                attr(layoutEl, 'prefix'),
                (v) => setAttr(layoutEl, 'prefix', v),
                '',
                '(',
              )}
              {@render words(
                t('style-ends-with'),
                attr(layoutEl, 'suffix'),
                (v) => setAttr(layoutEl, 'suffix', v),
                '',
                ')',
              )}
              {@render words(
                t('style-between-works'),
                attr(layoutEl, 'delimiter'),
                (v) => setAttr(layoutEl, 'delimiter', v),
                '',
                '; ',
              )}
              {#if kind !== 'note'}
                {@render pick(
                  t('style-collapse'),
                  attr(scopeEl, 'collapse'),
                  (v) => setAttr(scopeEl, 'collapse', v),
                  [
                    ['', t('style-collapse-none')],
                    ['year', t('style-collapse-year')],
                    ['year-suffix', t('style-collapse-year-suffix')],
                    ['year-suffix-ranged', t('style-collapse-year-suffix-ranged')],
                    ['citation-number', t('style-collapse-citation-number')],
                  ],
                )}
                <h4>{t('style-disambiguate')}</h4>
                {@render yes(
                  t('style-disambiguate-year-suffix'),
                  attr(scopeEl, 'disambiguate-add-year-suffix'),
                  (v) => setAttr(scopeEl, 'disambiguate-add-year-suffix', v),
                  '1979a, 1979b',
                )}
                {@render yes(
                  t('style-disambiguate-names'),
                  attr(scopeEl, 'disambiguate-add-names'),
                  (v) => setAttr(scopeEl, 'disambiguate-add-names', v),
                )}
                {@render yes(
                  t('style-disambiguate-given-names'),
                  attr(scopeEl, 'disambiguate-add-givenname'),
                  (v) => setAttr(scopeEl, 'disambiguate-add-givenname', v),
                )}
              {:else}
                {@render count(
                  t('style-near-note'),
                  attr(scopeEl, 'near-note-distance'),
                  (v) => setAttr(scopeEl, 'near-note-distance', v),
                  t('style-near-note-hint'),
                )}
              {/if}
            {:else}
              <h3>{t('style-entries')}</h3>
              {@render words(
                t('style-entry-ends-with'),
                attr(layoutEl, 'suffix'),
                (v) => setAttr(layoutEl, 'suffix', v),
                '',
                '.',
              )}
              {@render words(
                t('style-author-repeated'),
                attr(scopeEl, 'subsequent-author-substitute'),
                (v) => setAttr(scopeEl, 'subsequent-author-substitute', v),
                t('style-author-repeated-hint'),
                '———',
              )}
              {@render yes(
                t('style-hanging-indent'),
                attr(scopeEl, 'hanging-indent'),
                (v) => setAttr(scopeEl, 'hanging-indent', v),
                t('style-hanging-indent-hint'),
              )}
              {@render pick(
                t('style-second-field'),
                attr(scopeEl, 'second-field-align'),
                (v) => setAttr(scopeEl, 'second-field-align', v),
                [
                  ['', t('style-second-field-line')],
                  ['flush', t('style-second-field-column')],
                  ['margin', t('style-second-field-margin')],
                ],
                t('style-second-field-hint'),
              )}
            {/if}

            <h3>{t('style-throughout')}</h3>
            {@render pick(
              t('style-page-ranges'),
              attr(style.root, 'page-range-format'),
              (v) => setAttr(style!.root, 'page-range-format', v),
              [
                ['', t('style-page-ranges-as-entered')],
                ['expanded', t('style-page-ranges-expanded')],
                ['minimal', t('style-page-ranges-minimal')],
                ['minimal-two', t('style-page-ranges-minimal-two')],
                ['chicago', t('style-page-ranges-chicago')],
              ],
            )}
            {@render pick(
              t('style-particles'),
              attr(style.root, 'demote-non-dropping-particle'),
              (v) => setAttr(style!.root, 'demote-non-dropping-particle', v),
              [
                ['', t('style-as-the-style-has-it')],
                ['never', t('style-particles-never')],
                ['sort-only', t('style-particles-sort-only')],
                ['display-and-sort', t('style-particles-display-and-sort')],
              ],
            )}
            {@render yes(
              t('style-hyphen'),
              attr(style.root, 'initialize-with-hyphen') || 'true',
              (v) => setAttr(style!.root, 'initialize-with-hyphen', v === 'true' ? null : 'false'),
              t('style-hyphen-hint'),
            )}
            {@render pick(
              t('style-locale'),
              attr(style.root, 'default-locale'),
              (v) => setAttr(style!.root, 'default-locale', v),
              [['', t('style-locale-document')], ...locales],
              t('style-locale-hint'),
            )}
          </div>
        {:else if depth === 'parts'}
          <div class="parts">
            <div class="tree" role="tree" aria-label={t('style-parts-of', { scope })}>
              {#each rows as row (row.el)}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <div
                  class="part"
                  class:selected={selected === row.el}
                  class:branch={['if', 'else-if', 'else', 'choose'].includes(row.el.localName)}
                  role="treeitem"
                  tabindex="-1"
                  aria-selected={selected === row.el}
                  aria-expanded={row.parts ? open.has(row.el) : undefined}
                  style:padding-left="{8 + row.depth * 16}px"
                  onclick={() => (selected = row.el)}
                  ondblclick={() => row.parts && toggle(row.el)}
                >
                  <button
                    type="button"
                    class="twisty"
                    class:open={open.has(row.el)}
                    class:hidden={!row.parts}
                    aria-label={open.has(row.el) ? t('style-part-fold') : t('style-part-unfold')}
                    tabindex="-1"
                    onclick={(e) => {
                      e.stopPropagation();
                      toggle(row.el);
                    }}
                  >
                    <ChevronRight size={13} />
                  </button>
                  <span class="words truncate">{row.words}</span>
                  {#if row.form}<span class="form-words truncate">{row.form}</span>{/if}
                </div>
              {/each}
              {#if !rows.length}
                <p class="none">{t('style-parts-none', { scope })}</p>
              {/if}
            </div>

            <div class="detail">
              {#if selected}
                {@const el = selected}
                <div class="detail-head">
                  <h3>{csl.describe(el)}</h3>
                  <IconButton
                    label={t('style-part-up')}
                    size="sm"
                    onclick={() => csl.move(el, -1) && touch()}><ArrowUp size={14} /></IconButton
                  >
                  <IconButton
                    label={t('style-part-down')}
                    size="sm"
                    onclick={() => csl.move(el, 1) && touch()}><ArrowDown size={14} /></IconButton
                  >
                  <IconButton
                    label={t('style-part-add-after')}
                    size="sm"
                    onclick={(e) => addPart(e, el, false)}><Plus size={14} /></IconButton
                  >
                  <IconButton
                    label={t('style-part-take-away')}
                    size="sm"
                    disabled={el.localName === 'layout' || el.localName === 'if'}
                    onclick={() => {
                      if (csl.remove(el)) {
                        selected = null;
                        touch();
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
                {#if selectedWithin && uses > 1}
                  <p class="shared">
                    {t('style-part-shared', { macro: selectedWithin, count: uses })}
                  </p>
                {/if}

                {#if el.localName === 'text' && el.hasAttribute('value')}
                  {@render words(t('style-part-words'), attr(el, 'value'), (v) => {
                    el.setAttribute('value', v);
                    touch();
                  })}
                {/if}
                {#if csl.hasAffixes(el)}
                  {@render words(
                    t('style-part-before'),
                    attr(el, 'prefix'),
                    (v) => setAttr(el, 'prefix', v),
                    t('style-part-before-hint'),
                  )}
                  {@render words(t('style-part-after'), attr(el, 'suffix'), (v) =>
                    setAttr(el, 'suffix', v),
                  )}
                {/if}
                {#if csl.hasDelimiter(el)}
                  {@render words(t('style-part-between'), attr(el, 'delimiter'), (v) =>
                    setAttr(el, 'delimiter', v),
                  )}
                {/if}
                {#if csl.printsText(el)}
                  {@render pick(
                    t('style-slant'),
                    attr(el, 'font-style'),
                    (v) => setAttr(el, 'font-style', v),
                    selects['font-style'],
                  )}
                  {@render pick(
                    t('style-weight'),
                    attr(el, 'font-weight'),
                    (v) => setAttr(el, 'font-weight', v),
                    selects['font-weight'],
                  )}
                  {@render pick(
                    t('style-letters'),
                    attr(el, 'font-variant'),
                    (v) => setAttr(el, 'font-variant', v),
                    selects['font-variant'],
                  )}
                  {@render pick(
                    t('style-case'),
                    attr(el, 'text-case'),
                    (v) => setAttr(el, 'text-case', v),
                    selects['text-case'],
                  )}
                  {@render pick(
                    t('style-height'),
                    attr(el, 'vertical-align'),
                    (v) => setAttr(el, 'vertical-align', v),
                    selects['vertical-align'],
                  )}
                {/if}
                {#if el.localName === 'text'}
                  {@render yes(t('style-quotes'), attr(el, 'quotes'), (v) =>
                    setAttr(el, 'quotes', v),
                  )}
                  {@render yes(
                    t('style-strip-periods'),
                    attr(el, 'strip-periods'),
                    (v) => setAttr(el, 'strip-periods', v),
                    t('style-strip-periods-hint'),
                  )}
                {/if}
                {#if el.localName === 'text' && el.hasAttribute('variable')}
                  {@render pick(
                    t('style-text-form'),
                    attr(el, 'form'),
                    (v) => setAttr(el, 'form', v),
                    [
                      ['', t('style-text-form-long')],
                      ['short', t('style-text-form-short')],
                    ],
                  )}
                {/if}
                {#if el.localName === 'label' || (el.localName === 'text' && el.hasAttribute('term'))}
                  {@render pick(
                    t('style-term-form'),
                    attr(el, 'form'),
                    (v) => setAttr(el, 'form', v),
                    [
                      ['', t('style-term-form-long')],
                      ['short', t('style-term-form-short')],
                      ['verb', t('style-term-form-verb')],
                      ['verb-short', t('style-term-form-verb-short')],
                      ['symbol', t('style-term-form-symbol')],
                    ],
                  )}
                {/if}
                {#if el.localName === 'date'}
                  {@render pick(
                    t('style-date-parts'),
                    attr(el, 'date-parts'),
                    (v) => setAttr(el, 'date-parts', v),
                    [
                      ['', t('style-as-the-style-has-it')],
                      ['year', t('style-date-parts-year')],
                      ['year-month', t('style-date-parts-year-month')],
                      ['year-month-day', t('style-date-parts-full')],
                    ],
                  )}
                {/if}
                {#if csl.partsOf(style, el).length || ['group', 'layout', 'if', 'else-if', 'else', 'substitute'].includes(el.localName) || (el.localName === 'text' && el.hasAttribute('macro'))}
                  <div class="add-inside">
                    <Button size="sm" onclick={(e) => addPart(e, el, true)}>
                      {#snippet icon()}<Plus size={13} />{/snippet}
                      {t('style-part-add-within')}
                    </Button>
                  </div>
                {/if}
              {:else}
                <p class="none">{t('style-parts-hint')}</p>
              {/if}
            </div>
          </div>
        {:else}
          <div class="source-view">
            <textarea
              bind:value={source}
              spellcheck="false"
              aria-label={t('style-source')}
              oninput={() => (sourceError = null)}></textarea>
            <div class="source-foot">
              {#if sourceError}<p class="error selectable" role="alert">{sourceError}</p>{/if}
              <Button size="sm" onclick={applySource}>{t('style-source-try')}</Button>
            </div>
          </div>
        {/if}
      </div>

      <div class="sample" class:working={sampling}>
        {#if sampleError}
          <p class="overline">{t('style-sample-unusable')}</p>
          <pre class="selectable">{sampleError}</pre>
        {:else if !sample}
          <div class="centre"><Spinner size={20} /></div>
        {:else}
          <p class="overline">
            {kind === 'note' ? t('style-sample-in-notes') : t('style-sample-in-text')}
          </p>
          <dl>
            {#each sample.citations as html, i (i)}
              <dt>{captions[i] ?? t('style-sample-cited')}</dt>
              <!-- Cleaned above: only the elements of type, without attributes but their class. -->
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              <dd class="selectable">{@html html}</dd>
            {/each}
          </dl>
          {#if sample.bibliography.length}
            <p class="overline">{t('style-sample-in-bibliography')}</p>
            <div
              class="entries"
              class:hanging={attr(csl.scopeElement(style, 'bibliography'), 'hanging-indent') ===
                'true'}
            >
              {#each sample.bibliography as html, i (i)}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                <p class="selectable">{@html html}</p>
              {/each}
            </div>
          {/if}
          <p class="which">
            {works === EXAMPLES ? t('style-sample-examples') : t('style-sample-library')}
          </p>
        {/if}
      </div>
    </div>
  {/if}

  {#snippet footer()}
    {#if own}
      <div class="left">
        <Button variant="danger" onclick={removeStyle}>{t('style-delete')}</Button>
      </div>
    {:else}
      <div class="left note">{t('style-bundled')}</div>
    {/if}
    <Button variant="ghost" onclick={close}>{t('common-cancel')}</Button>
    <Button
      variant="primary"
      disabled={saving || !style || !name.trim() || !!sampleError || (own && !changed)}
      onclick={save}
    >
      {own ? t('common-save') : t('style-save-own')}
    </Button>
  {/snippet}
</Dialog>

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .head h2 {
    flex: none;
    font-family: var(--font-text);
    font-size: var(--text-xl);
    font-weight: 600;
  }
  .name {
    flex: 1;
    max-width: 460px;
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    font-family: var(--font-text);
    font-size: 15px;
    outline: none;
  }
  .name:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .centre {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
  }
  .editor {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    height: 100%;
    min-height: 0;
    border-top: 1px solid var(--line);
  }
  .left-side {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  .bar {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex: none;
    padding: 12px 24px;
    border-bottom: 1px solid var(--line);
  }
  .form {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 6px 24px 28px;
  }
  h3 {
    margin: 20px 0 8px;
    font-family: var(--font-text);
    font-size: var(--text-xl);
    font-weight: 500;
  }
  h4 {
    margin: 16px 0 4px;
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 250px;
    gap: 14px;
    align-items: center;
    min-height: 38px;
    padding: 4px 0;
    border-bottom: 1px solid var(--line);
  }
  .row.check {
    grid-template-columns: minmax(0, 1fr) auto;
    cursor: pointer;
  }
  .row.sentence {
    grid-template-columns: 1fr;
    line-height: 2;
  }
  .what {
    display: block;
    min-width: 0;
  }
  .what small {
    display: block;
    font-size: var(--text-xs);
    color: var(--ink-3);
    line-height: 1.35;
  }
  input:not([type='checkbox']),
  select {
    width: 100%;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    outline: none;
  }
  :is(input, select, textarea):focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  input.literal {
    font-family: var(--font-mono);
    font-size: 12.5px;
    white-space: pre;
  }
  input.short {
    width: 80px;
    justify-self: end;
    text-align: right;
  }
  input.inline {
    display: inline-block;
    width: 52px;
    height: 24px;
    margin: 0 3px;
    padding: 0 4px;
    text-align: center;
  }
  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--accent);
    margin: 0;
  }
  .parts {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
  }
  .tree {
    overflow: auto;
    padding: 10px 8px 20px;
    border-right: 1px solid var(--line);
  }
  .part {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-height: 28px;
    padding: 3px 8px;
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .part:hover {
    background: var(--paper-hover);
  }
  .part.selected {
    background: var(--accent-soft);
  }
  .part.branch .words {
    color: var(--ink-3);
    font-style: italic;
  }
  .words {
    flex: none;
    max-width: 100%;
  }
  .form-words {
    flex: 1;
    min-width: 0;
    font-size: var(--text-xs);
    color: var(--ink-3);
    white-space: pre;
  }
  .twisty {
    display: inline-flex;
    align-self: center;
    width: 16px;
    height: 16px;
    flex: none;
    padding: 0;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
    transition: transform var(--fast) var(--ease);
  }
  .twisty.open {
    transform: rotate(90deg);
  }
  .twisty.hidden {
    visibility: hidden;
  }
  .detail {
    overflow-y: auto;
    padding: 4px 16px 24px;
  }
  .detail .row {
    grid-template-columns: minmax(0, 1fr) 150px;
  }
  .detail-head {
    display: flex;
    align-items: center;
    gap: 2px;
    margin: 12px 0 6px;
  }
  .detail-head h3 {
    flex: 1;
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
    font-family: var(--font-ui);
  }
  .shared {
    margin: 0 0 8px;
    padding: 7px 10px;
    border-radius: var(--radius-s);
    background: var(--gold-soft);
    font-size: var(--text-sm);
    line-height: 1.4;
  }
  .add-inside {
    margin-top: 14px;
  }
  .none {
    padding: 16px 8px;
    color: var(--ink-3);
    line-height: 1.55;
  }
  .source-view {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .source-view textarea {
    flex: 1;
    min-height: 0;
    padding: 14px 18px;
    border: none;
    background: var(--paper);
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.6;
    white-space: pre;
    resize: none;
    outline: none;
    tab-size: 2;
  }
  .source-view textarea:focus {
    box-shadow: none;
  }
  .source-foot {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 8px 16px;
    border-top: 1px solid var(--line);
  }
  .source-foot .error {
    flex: 1;
    margin: 0;
  }
  .sample {
    padding: 22px 28px 28px;
    background: var(--paper-sunken);
    border-left: 1px solid var(--line);
    overflow-y: auto;
    transition: opacity var(--slow) var(--ease);
  }
  .sample.working {
    opacity: 0.7;
  }
  .sample .overline {
    margin-bottom: 8px;
  }
  .sample .overline:not(:first-child) {
    margin-top: 26px;
  }
  dl {
    margin: 0;
  }
  dt {
    margin-top: 10px;
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  dd {
    margin: 1px 0 0;
    font-family: var(--font-text);
    font-size: 15px;
    line-height: 1.5;
  }
  dd :global(.gk-note) {
    display: block;
    padding-left: 12px;
    border-left: 2px solid var(--gold);
  }
  .entries p {
    margin: 0 0 8px;
    font-family: var(--font-text);
    font-size: 15px;
    line-height: 1.5;
  }
  .entries.hanging p {
    padding-left: 1.6em;
    text-indent: -1.6em;
  }
  .entries :global(.csl-left-margin) {
    display: inline;
    margin-right: 0.5em;
  }
  .entries :global(.csl-right-inline) {
    display: inline;
  }
  .entries :global(div) {
    text-indent: 0;
  }
  .which {
    margin-top: 22px;
    font-size: var(--text-xs);
    color: var(--ink-4);
  }
  pre {
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--radius-s);
    background: var(--danger-soft);
    color: var(--danger);
    font-family: var(--font-mono);
    font-size: 11.5px;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .error {
    margin: 10px 24px 0;
    padding: 8px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
  }
  .left {
    margin-right: auto;
  }
  .note {
    max-width: 52ch;
    font-size: var(--text-sm);
    color: var(--ink-3);
    line-height: 1.4;
  }
</style>

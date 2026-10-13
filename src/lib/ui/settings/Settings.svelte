<script lang="ts" generics="T">
  import { lengthOk, setValue, valueOf, type Provenance, type Row, type Setting } from './rows';

  interface Props {
    /** What the rows set. */
    target: T;
    rows: Row<T>[];
    /** Where the value at a path comes from; nothing where it is as it first was. */
    from?: (path: string) => Provenance | null;
    /** What stands before the path of a row in what `from` is asked: `figures.` for the rows of the figures. */
    prefix?: string;
  }

  let { target, rows, from, prefix = '' }: Props = $props();

  function provenance(row: Setting<T>): Provenance | null {
    if (!from) return null;
    const path = row.path ?? (row.at !== undefined ? prefix + row.at : undefined);
    return path ? from(path) : null;
  }
</script>

<!-- The rows of a form of settings: see rows.ts. How they look is in settings.css. -->
{#each rows as row, i (i)}
  {#if !row.when || row.when(target)}
    {#if 'heading' in row}
      <h3>{row.heading}</h3>
    {:else if 'subheading' in row}
      <h4>{row.subheading}</h4>
    {:else if 'note' in row}
      <p class="hint">{row.note}</p>
    {:else}
      {@const value = valueOf(row, target)}
      {@const said = provenance(row)}
      <label class="row" class:check={row.kind === 'toggle'}>
        <span class="what"
          >{row.label}{#if row.hint}<small>{row.hint}</small>{/if}</span
        >
        {#if row.kind === 'toggle'}
          <input
            type="checkbox"
            checked={value === true}
            onchange={(e) => setValue(row, target, e.currentTarget.checked)}
          />
        {:else if row.kind === 'text'}
          <input
            class:literal={row.literal}
            value={(value as string) ?? ''}
            placeholder={row.placeholder}
            spellcheck={row.literal ? 'false' : undefined}
            oninput={(e) => setValue(row, target, e.currentTarget.value)}
          />
        {:else if row.kind === 'length'}
          <input
            class="short"
            class:invalid={!lengthOk((value as string) ?? '')}
            value={(value as string) ?? ''}
            spellcheck="false"
            oninput={(e) => setValue(row, target, e.currentTarget.value)}
          />
        {:else if row.kind === 'number'}
          {@const n = value as number | null | undefined}
          <span class="with-unit">
            <input
              class="short"
              type="number"
              min={row.min ?? 0}
              max={row.max ?? 100}
              step={row.step ?? 0.5}
              value={n ?? (row.blank !== undefined ? '' : 0)}
              placeholder={row.blank}
              oninput={(e) => {
                const raw = e.currentTarget.value;
                if (raw.trim() === '' && row.blank !== undefined)
                  return setValue(row, target, null);
                const v = Number(raw);
                if (Number.isFinite(v)) setValue(row, target, row.nullable && v === 0 ? null : v);
              }}
            />
            <em>{row.zero && !n ? row.zero : (row.unit ?? '')}</em>
          </span>
        {:else if row.kind === 'choice'}
          <select
            value={String(value)}
            onchange={(e) => {
              const found = row.options.find(([v]) => String(v) === e.currentTarget.value);
              if (found) setValue(row, target, found[0]);
            }}
          >
            {#each row.options as [v, words] (v)}
              <option value={String(v)}>{words}</option>
            {/each}
            {#if !row.options.some(([v]) => v === value)}
              <option value={String(value)}>{value}</option>
            {/if}
          </select>
        {/if}
      </label>
      {#if said}
        <!-- Out of the label: a button within it would be what the label clicks. -->
        <p class="from" data-from>
          {said.words}{#if said.again}{' · '}<button
              type="button"
              class="again"
              onclick={said.again.take}>{said.again.label}</button
            >{/if}
        </p>
      {/if}
    {/if}
  {/if}
{/each}

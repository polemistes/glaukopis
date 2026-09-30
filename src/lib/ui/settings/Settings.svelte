<script lang="ts" generics="T">
  import { lengthOk, setValue, valueOf, type Row } from './rows';

  interface Props {
    /** What the rows set. */
    target: T;
    rows: Row<T>[];
  }

  let { target, rows }: Props = $props();
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
    {/if}
  {/if}
{/each}

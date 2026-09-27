<script lang="ts" generics="T extends string">
  import ChevronDown from '@lucide/svelte/icons/chevron-down';

  interface Option {
    value: T;
    label: string;
    group?: string;
  }

  interface Props {
    value: T;
    options: Option[];
    label?: string;
    size?: 'sm' | 'md';
    disabled?: boolean;
    onchange?: (value: T) => void;
  }

  let {
    value = $bindable(),
    options,
    label,
    size = 'md',
    disabled = false,
    onchange,
  }: Props = $props();

  const uid = $props.id();

  const groups = $derived.by(() => {
    const out: { name: string | undefined; options: Option[] }[] = [];
    for (const option of options) {
      const last = out[out.length - 1];
      if (last && last.name === option.group) last.options.push(option);
      else out.push({ name: option.group, options: [option] });
    }
    return out;
  });
</script>

<div class="field {size}">
  {#if label}<label for="select-{uid}">{label}</label>{/if}
  <div class="box">
    <select
      id="select-{uid}"
      bind:value
      {disabled}
      onchange={(e) => onchange?.(e.currentTarget.value as T)}
    >
      {#each groups as group}
        {#if group.name}
          <optgroup label={group.name}>
            {#each group.options as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </optgroup>
        {:else}
          {#each group.options as option (option.value)}
            <option value={option.value}>{option.label}</option>
          {/each}
        {/if}
      {/each}
    </select>
    <span class="chevron"><ChevronDown size={14} /></span>
  </div>
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--ink-2);
  }
  .box {
    position: relative;
    display: flex;
    align-items: center;
  }
  select {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    height: var(--control-h);
    padding: 0 28px 0 9px;
    background: var(--paper-raised);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    cursor: pointer;
    text-overflow: ellipsis;
  }
  .sm select {
    height: 26px;
    font-size: var(--text-sm);
  }
  select:focus-visible {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  select:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .chevron {
    position: absolute;
    right: 8px;
    display: inline-flex;
    color: var(--ink-3);
    pointer-events: none;
  }
</style>

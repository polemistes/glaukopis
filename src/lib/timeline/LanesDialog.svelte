<script lang="ts">
  /**
   * How a map is shown as a timeline: which branches are its lanes (each
   * branch one lane, or each of its children a lane of their own), and
   * whether its axis is the dates of the world or the units of an invented
   * one, and what a unit is called.
   */
  import { untrack } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import type { Lane } from '$lib/project/model/types';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import TextField from '$lib/ui/TextField.svelte';

  interface Props {
    project: Project;
    mapId: string;
    onclose: () => void;
  }

  let { project, mapId, onclose }: Props = $props();

  const settings = $derived(project.map(mapId)?.timeline ?? {});
  const tree = $derived(project.tree(mapId));
  /** The branches that can be lanes: the centre's children, and theirs. */
  const branches = $derived.by(() => {
    const out: { id: string; name: string; level: number; children: number }[] = [];
    const walk = (id: string, level: number) => {
      const node = project.node(id);
      if (!node) return;
      const children = tree.children.get(id) ?? [];
      out.push({ id, name: node.title || t('project-untitled'), level, children: children.length });
      if (level < 2) for (const c of children) walk(c, level + 1);
    };
    for (const c of tree.children.get(tree.root ?? '') ?? []) walk(c, 1);
    return out;
  });

  const lanes = $derived(settings.lanes ?? []);
  const laneOf = (id: string): Lane | undefined => lanes.find((l) => l.element === id);
  /** Whether the lanes are as they are by themselves: each child of the centre one. */
  const given = $derived(!lanes.length);

  function toggle(id: string, each: boolean) {
    const had = laneOf(id);
    let next: Lane[];
    if (had && had.each === each) next = lanes.filter((l) => l.element !== id);
    else
      next = [...lanes.filter((l) => l.element !== id), { element: id, ...(each ? { each } : {}) }];
    // In the order of the text.
    const order = new Map(tree.sequence.map((e, i) => [e, i]));
    next.sort((a, b) => (order.get(a.element) ?? 0) - (order.get(b.element) ?? 0));
    project.setTimeline(mapId, { lanes: next });
  }

  let unit = $state(untrack(() => settings.unit ?? ''));
  function keepUnit() {
    if ((settings.unit ?? '') !== unit.trim()) project.setTimeline(mapId, { unit: unit.trim() });
  }
</script>

<Dialog open title={t('timeline-settings')} width={480} {onclose}>
  <div class="form">
    <section>
      <h3>{t('timeline-axis')}</h3>
      <Segmented
        value={settings.axis ?? 'dates'}
        label={t('timeline-axis')}
        size="sm"
        options={[
          { value: 'dates', label: t('timeline-axis-dates') },
          { value: 'units', label: t('timeline-axis-units') },
        ]}
        onchange={(axis) => project.setTimeline(mapId, { axis })}
      />
      {#if settings.axis === 'units'}
        <div class="unit">
          <TextField
            bind:value={unit}
            label={t('timeline-unit')}
            placeholder={t('timeline-unit-placeholder')}
            size="sm"
            onblur={keepUnit}
            onkeydown={(e) => e.key === 'Enter' && keepUnit()}
          />
        </div>
        <p class="hint">{t('timeline-units-hint')}</p>
      {:else}
        <p class="hint">{t('timeline-dates-hint')}</p>
      {/if}
    </section>

    <section>
      <h3>{t('timeline-lanes')}</h3>
      <p class="hint">{given ? t('timeline-lanes-given') : t('timeline-lanes-chosen')}</p>
      {#if branches.length}
        <ul class="branches">
          {#each branches as b (b.id)}
            {@const lane = laneOf(b.id)}
            <li style:padding-left="{(b.level - 1) * 18}px">
              <span class="name truncate">{b.name}</span>
              <span class="choices">
                <button
                  type="button"
                  class:on={lane && !lane.each}
                  aria-pressed={!!lane && !lane.each}
                  onclick={() => toggle(b.id, false)}>{t('timeline-one-lane')}</button
                >
                {#if b.children}
                  <button
                    type="button"
                    class:on={!!lane?.each}
                    aria-pressed={!!lane?.each}
                    onclick={() => toggle(b.id, true)}
                    >{t('timeline-each-child', { count: b.children })}</button
                  >
                {/if}
              </span>
            </li>
          {/each}
        </ul>
        {#if !given}
          <Button
            size="sm"
            variant="ghost"
            onclick={() => project.setTimeline(mapId, { lanes: [] })}
          >
            {t('timeline-lanes-reset')}
          </Button>
        {/if}
      {:else}
        <p class="hint">{t('timeline-no-branches')}</p>
      {/if}
    </section>
  </div>

  {#snippet footer()}
    <Button variant="primary" onclick={onclose}>{t('common-done')}</Button>
  {/snippet}
</Dialog>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  h3 {
    margin: 0 0 8px;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--ink-2);
  }
  .unit {
    margin-top: 10px;
    max-width: 220px;
  }
  .hint {
    margin: 6px 0 0;
    font-size: var(--text-xs);
    color: var(--ink-4);
    line-height: 1.5;
  }
  .branches {
    list-style: none;
    margin: 8px 0;
    padding: 0;
    max-height: 40vh;
    overflow-y: auto;
  }
  .branches li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 0;
  }
  .name {
    flex: 1;
    min-width: 0;
  }
  .choices {
    display: flex;
    gap: 4px;
    flex: none;
  }
  .choices button {
    padding: 2px 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .choices button.on {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--accent-strong);
  }
</style>

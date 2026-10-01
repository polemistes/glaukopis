<script lang="ts">
  /**
   * A kind of paragraph or of words of the writer's own, made or changed:
   * its name, what it is based on, and how it differs from that, by the
   * measures a format uses. What is not said is as the base has it. A name
   * is offered from the kinds made before, in any project, and brings what
   * it was based on and how it differed. See ADR 0029.
   */
  import { tick, untrack } from 'svelte';
  import type { KindFamily, Look } from '$lib/api/documents';
  import { CATALOGUE, GROUPS, specOf } from '$lib/editor/kinds';
  import { rememberPassageKind } from '$lib/editor/own-kinds.svelte';
  import { t } from '$lib/i18n';
  import { lengthsOk, lookRows, unsaid, type LookReach } from '$lib/preview/formatEditor.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Settings from '$lib/ui/settings/Settings.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import type { Project } from './model/project.svelte';

  interface Props {
    project: Project;
    /** The kind that is changed; nothing for one that is made. */
    id: string | null;
    /** Of paragraphs or of words, for a kind that is made; one that is changed is what it is. */
    family: KindFamily;
    /** Called with the id of a kind that is made: to put it on the selection. */
    apply?: (id: string) => void;
    onclose: () => void;
  }

  let { project, id, family: asked, apply, onclose }: Props = $props();

  // What the kind was when the dialog opened: the form starts from it.
  const existing = untrack(() => project.passageKind(id));
  const family: KindFamily = existing?.family ?? untrack(() => asked);
  let name = $state(existing?.name ?? '');
  /** The id of the base; empty for plain words. */
  let basedOn = $state(existing?.basedOn ?? (family === 'paragraph' ? 'text' : ''));
  /** How it differs from the base: the rows write into it. */
  let look = $state<Look>({ ...existing?.look });
  let field = $state<HTMLInputElement>();

  const uid = $props.id();
  const lower = (s: string) => s.trim().toLocaleLowerCase();
  /** The kinds made before, of this family, that are not of this project already. */
  const known = $derived(
    settings.value.passageKinds.filter(
      (k) =>
        k.family === family && !project.passageKinds.some((p) => lower(p.name) === lower(k.name)),
    ),
  );
  // One name for one kind, of either family: a kind is a named style in Word and Writer.
  const taken = $derived(
    project.passageKinds.some((k) => k.id !== id && lower(k.name) === lower(name)),
  );
  /** The kinds of the catalogue a kind of this family can be based on, in their groups. */
  const groups = $derived(
    GROUPS.map((g) => ({
      label: g.label(),
      kinds: CATALOGUE.filter((k) => k.group === g.id && k.family === family),
    })).filter((g) => g.kinds.length),
  );
  /** The other kinds of the writer's own, of this family. */
  const others = $derived(project.passageKinds.filter((k) => k.family === family && k.id !== id));
  const lengthsFine = $derived(lengthsOk(look));

  /** The kind of the catalogue a base comes to, through the writer's own kinds; nothing for plain words. */
  function rootOf(base: string): string | undefined {
    const seen = new Set<string>();
    let at: string | undefined = base;
    for (let depth = 0; at && depth < 8 && !seen.has(at); depth++) {
      seen.add(at);
      if (specOf(at)) return at;
      at = project.passageKind(at)?.basedOn;
    }
    return undefined;
  }

  const reach: LookReach<Look> = {
    get: (l) => l,
    set: (l, key, value) => {
      if (unsaid(value)) delete l[key];
      else (l as Record<string, unknown>)[key] = value;
    },
  };
  const rows = $derived(lookRows<Look>(family, reach, { sign: rootOf(basedOn) === 'break' }));

  $effect(() => {
    field?.focus();
  });

  /** A name picked from those made before brings what it was based on and how it differed. */
  function named() {
    const was = known.find((k) => lower(k.name) === lower(name));
    if (!was || existing) return;
    basedOn = was.basedOn;
    look = { ...was.look };
  }

  function keep() {
    if (!name.trim() || taken || !lengthsFine) return;
    const draft = { name, family, basedOn, look: $state.snapshot(look) as Look };
    const made = id ? null : project.createPassageKind(draft);
    if (id) project.updatePassageKind(id, draft);
    rememberPassageKind(draft);
    // Held before the dialog goes: its properties go with it.
    const give = apply;
    onclose();
    // Given to the text once the dialog is gone: while it is open, the text cannot take the cursor back.
    if (made && give) void tick().then(() => give(made));
  }

  /** The kind is deleted; the passages that are of it stay as they are, and are set as text in documents. */
  async function remove() {
    if (!id) return;
    const count = [...project.nodes.values()].filter((n) => n.uses.includes(id)).length;
    const sure = await confirm({
      title: t('editor-own-kind-delete-title', { name: existing?.name ?? '' }),
      message: t('editor-own-kind-delete-message', { count }),
      confirm: t('common-delete'),
      danger: true,
    });
    if (!sure) return;
    project.deletePassageKind(id);
    onclose();
  }

  function onkeydown(event: KeyboardEvent) {
    const target = event.target;
    if (
      event.key === 'Enter' &&
      !(target instanceof HTMLTextAreaElement) &&
      !(target instanceof HTMLSelectElement)
    ) {
      event.preventDefault();
      keep();
    }
  }
</script>

<Dialog
  open
  title={id ? t('editor-own-kind-change') : t('editor-own-kind-new')}
  width={540}
  {onclose}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="form" {onkeydown}>
    <TextField
      bind:value={name}
      bind:el={field}
      label={t('editor-own-kind-name')}
      placeholder={family === 'words'
        ? t('editor-own-kind-words-placeholder')
        : t('editor-own-kind-name-placeholder')}
      list={known.length ? `own-kinds-known-${uid}` : undefined}
      error={taken ? t('editor-own-kind-name-taken') : null}
      autocomplete="off"
      spellcheck="false"
      onchange={named}
      oninput={named}
    />
    {#if known.length}
      <datalist id="own-kinds-known-{uid}">
        {#each known as k (k.name)}<option value={k.name}></option>{/each}
      </datalist>
    {/if}

    <div class="settings">
      <label class="row">
        <span class="what"
          >{t('editor-own-kind-based-on')}<small>{t('editor-own-kind-based-on-hint')}</small></span
        >
        <select bind:value={basedOn}>
          {#if family === 'words'}
            <option value="">{t('editor-plain-words')}</option>
          {/if}
          {#each groups as g (g.label)}
            <optgroup label={g.label}>
              {#each g.kinds as k (k.id)}
                <option value={k.id}>{k.label()}</option>
              {/each}
            </optgroup>
          {/each}
          {#if others.length}
            <optgroup label={t('editor-kinds-own')}>
              {#each others as k (k.id)}
                <option value={k.id}>{k.name}</option>
              {/each}
            </optgroup>
          {/if}
        </select>
      </label>
      <h4>{t('editor-own-kind-look')}</h4>
      <Settings target={look} {rows} />
      <p class="hint" class:bad={!lengthsFine}>{t('format-lengths-hint')}</p>
    </div>
  </div>

  {#snippet footer()}
    {#if id}
      <Button variant="ghost" onclick={remove}>{t('common-delete')}</Button>
      <span class="gap"></span>
    {/if}
    <Button variant="ghost" onclick={onclose}>{t('common-cancel')}</Button>
    <Button variant="primary" disabled={!name.trim() || taken || !lengthsFine} onclick={keep}>
      {id ? t('common-save') : t('editor-own-kind-create')}
    </Button>
  {/snippet}
</Dialog>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .settings h4 {
    margin-top: 10px;
  }
  .hint.bad {
    color: var(--danger);
  }
  .gap {
    flex: 1;
  }
</style>

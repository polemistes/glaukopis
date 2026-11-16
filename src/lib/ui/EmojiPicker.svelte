<script lang="ts">
  /**
   * Where an emoji is chosen: the groups of Unicode behind a row of tabs,
   * the emojis chosen last first. It stands over an anchor and calls
   * `onpick` with each emoji chosen. The emojis come from
   * `emoji-list.generated.ts`.
   */
  import { t } from '$lib/i18n';
  import EmojiPanel from './EmojiPanel.svelte';
  import type { Align, Side } from './floating';
  import Popover from './Popover.svelte';

  interface Props {
    open: boolean;
    /** What it is opened at. */
    anchor: HTMLElement | null | undefined;
    /** Called with each emoji chosen. */
    onpick: (emoji: string) => void;
    onclose: () => void;
    /** Whether it stays open after an emoji is chosen, for choosing several; it closes after one otherwise. */
    stay?: boolean;
    side?: Side;
    align?: Align;
  }

  let {
    open,
    anchor,
    onpick,
    onclose,
    stay = false,
    side = 'top',
    align = 'start',
  }: Props = $props();
</script>

<Popover {open} {anchor} {side} {align} width={300} label={t('emoji-title')} {onclose}>
  <EmojiPanel {onpick} {onclose} {stay} />
</Popover>

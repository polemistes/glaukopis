<!--
  What the chats of the projects open do while no one looks at them (records
  0092 and 0107): a message of another that arrives while the chat of its
  project is not shown is told by a toast, with Show, which opens the chat;
  several that arrive at once are told by one toast that counts them. While
  the chat is shown with the window in front, its messages are counted as
  read: the mark is kept with the project's view, and, while the project is
  shared, in the project, so that the others see who has read what. While
  the chat is shown, what is new in it is kept for the panel to mark.
  Mounted once, by the view of the projects; it draws nothing.
-->
<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { t } from '$lib/i18n';
  import { openProjects, type OpenProject } from '$lib/project/open-projects.svelte';
  import { toasts } from '$lib/ui/toast.svelte';
  import { chatShown, chatUi, keepFresh, unreadOf } from './chat.svelte';
  import { firstWords, markOf, sameMark } from './reading';

  /** How long after a message arrives it is told: those that come with it are told with it. */
  const GATHER = 300;

  /** The messages told already, by project: each is told once while the window is open. */
  const told = new Map<string, Set<string>>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const toldOf = (id: string) => {
    let set = told.get(id);
    if (!set) told.set(id, (set = new Set()));
    return set;
  };

  /** Tells what arrived in a project's chat and has not been told, unless its chat is shown by now. */
  function tell(open: OpenProject) {
    timers.delete(open.id);
    const p = open.project;
    if (!p || p.closed || openProjects.get(open.id) !== open) return;
    if (chatShown(open) && chatUi.inFront) return;
    const seen = toldOf(open.id);
    const fresh = unreadOf(open).filter((m) => !seen.has(m.id));
    if (!fresh.length) return;
    for (const m of fresh) seen.add(m.id);
    const message =
      fresh.length === 1
        ? t('chat-said', {
            name: fresh[0].author.name || t('chat-someone'),
            words: firstWords(fresh[0].text),
          })
        : t('chat-arrived', { count: fresh.length, project: p.name });
    toasts.show(
      { kind: 'info', message, action: { label: t('chat-show'), run: () => chatUi.show(open.id) } },
      8000,
    );
  }

  // For every project open: what is new in its chat is kept while the chat
  // is shown; where it is shown with the window in front, all its messages
  // are read, and while the project is shared, how far is kept in the
  // project for the others; else what is unread and untold is told a moment
  // after. It depends on the messages of each project, the mark of what was
  // read, the panes, the sharing and whether the window is in front;
  // nothing of the texts.
  $effect(() => {
    const inFront = chatUi.inFront;
    for (const open of openProjects.all()) {
      const p = open.project;
      if (!p) continue;
      const messages = p.chat;
      const shown = chatShown(open);
      const shared = !!open.sharing?.shared;
      const waiting = unreadOf(open);
      untrack(() => {
        keepFresh(open, shown);
        if (shown && inFront) {
          const mark = markOf(messages);
          if (mark && !sameMark(mark, open.chatRead)) open.chatRead = mark;
          if (mark && shared) p.markChatRead(mark);
          return;
        }
        const seen = toldOf(open.id);
        if (!waiting.some((m) => !seen.has(m.id)) || timers.has(open.id)) return;
        timers.set(
          open.id,
          setTimeout(() => tell(open), GATHER),
        );
      });
    }
  });

  onDestroy(() => {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
  });

  const front = () => (chatUi.inFront = true);
</script>

<svelte:window
  onfocus={front}
  onblur={() => (chatUi.inFront = false)}
  onpointerdowncapture={front}
  onkeydowncapture={front}
/>
<svelte:document
  onvisibilitychange={() => {
    if (document.visibilityState === 'hidden') chatUi.inFront = false;
  }}
/>

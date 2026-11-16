# The chat answered, set, marked and changed, and a paragraph made an element — the build plan

From the owner's words of 2026-11-16 (the last section of `docs/brief.md`, with the three choices the owner made when asked). Three parts, each built by one agent in a working copy of its own:

| Part | Record | The branch's work |
| --- | --- | --- |
| A | 0108, a paragraph made an element | `src/lib/project/text/heading.ts`, `split` in `MapText.svelte`, the words of the text, the e2e scripts that press Alt+Enter in a text |
| B | 0107, the chat answered, set, marked and changed | the model's chat, `src/lib/chat/`, the history's sessions |
| C | (in 0107) | the choosing of emojis: `src/lib/ui/EmojiPicker.svelte` and what it needs, new files only |

**No part changes Rust or `package.json`.** Everything is in `src/`, `locales/`, `docs/`, `e2e/` and `scripts/`. If you find you need a change in `crates/`, `src-tauri/` or a new dependency, stop and say so in your report instead of making it.

## How each part is built

Read `CLAUDE.md` (the map), then your part below, then the code it names. Nobody answers questions while you build: where something is open, choose the plainer thing, write the choice in your progress note and in your report, and go on.

- **Your working copy is a git worktree** on a branch of its own. First make sure it holds this plan: `git log --oneline -1 -- docs/plans/the-chat-answered-set-marked-and-changed-and-a-paragraph-made-an-element.md`; where it does not, `git merge --ff-only <the commit you were given>`. Then `pnpm install --frozen-lockfile --prefer-offline` (it has no `node_modules`). Commit on your branch after every step that passes `pnpm check`; never push, never merge into `main`, never touch another working copy. Never leave more than about twenty minutes of work uncommitted, and keep a progress note `PROGRESS-<part>.md` at the root of your working copy, untracked, written anew after every commit: what is done, what you are doing, what is next, what you decided and why.
- **Verify with `pnpm check` and `pnpm test`**, and `pnpm format` once your edits are done (edit first, format after; Prettier over `src/` only, never over `e2e/`). **Do not run cargo, `pnpm e2e:build` or any e2e script**: your working copy has no `target/`, and three builds at once would run the machine out of memory. Write or change the e2e scripts your part names, as carefully as you can from the scripts beside them and `e2e/harness.mjs`, and say in your report which you wrote and changed and that they have not been run. They are run, and mended, after the parts are merged.
- **Words**: every word the user sees is a Fluent message in `locales/en/` and `locales/nb/`, written together, plain and few (`locales/README.md`, `locales/GLOSSARY.md`). The other languages are not touched. No hints in menus, nothing explained that should be obvious. `t('…')` is reactive: in markup or `$derived`, not once at the top of a script.
- **The guide**: write what the user can now do into `docs/guide.md`, in the guide's own plain voice, where the part is described today; change what is no longer true. A test holds the Help reader to the whole guide (`src/lib/help/`): keep to the Markdown the guide already uses.
- **The record** (parts A and B): `docs/adr/01NN-….md` in the form of `0092` (read it): the owner's words, the context, the decision, *choices made in building this, which the owner has not been asked about* (those this plan lists, and yours), what is not done, as built. Add its row to the table of `docs/adr/README.md`, and change the rows of the records it amends.
- **Large files** (`MapText.svelte`, `ProjectView.svelte`): add as little as you can; what is new goes in a module or a component of its own.
- **Icons** come from Lucide (`@lucide/svelte`); draw nothing.
- **Never** read or write `~/.local/share/glaukopis`, `~/.local/share/org.glaukopis.Glaukopis` or `~/.mozilla`. Never build under `/tmp`. Nothing the application does may connect to a service it does not already use.
- **The commit trailer** is the model you are, e.g. `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` or `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. A commit message is full sentences in plain words saying what changed and why; no prefix.
- **Your report**: what was built and where, every choice you made where the plan left one, what `pnpm check` and `pnpm test` said (the numbers), what is not verified, anything you are unsure of, and faults you found outside your own files (say them, do not mend them, unless they stop you). Say plainly what you did not finish.

---

## Part A — a paragraph made an element (record 0108)

> Then a feature in the text view. When pressing alt+enter with the cursor inside a paragraph, the paragraph text should be made an element. If alt+enter is pressed when text is selected, the selected text becomes the element. The text before the selection belongs to the previous element, and the text after belongs to the new element.

Today Alt+Enter in a text makes *a heading at the cursor* (`src/lib/project/text/heading.ts`, `split` in `MapText.svelte`, from record 0062): what **follows the cursor** in its paragraph becomes the name of a new element, and the paragraphs below it the new element's text; at the end of a paragraph the name is empty. The owner wants the paragraph, or what is selected. Asked what the very end of a paragraph should do, the owner chose **one rule everywhere in a paragraph**: the paragraph becomes the element there too, and an empty element is begun by Enter and then Alt+Enter in the empty line.

### Decided

1. **With nothing selected, the paragraph the cursor is in becomes the name of a new element**, the whole of it, wherever in it the cursor stands: at its start, in its middle, at its end. The paragraphs before it stay in the element they were in; the paragraphs after it, to the end of the text, become the new element's text. The paragraph itself goes from the old text. **In an empty paragraph** the name is empty, the paragraphs below go in, and the empty paragraph goes: so Enter and then Alt+Enter begins an empty element after what was written.
2. **With text selected, what is selected becomes the name.** What stands before it, in its paragraph and above, stays in the element; what stands after it in its paragraph becomes the first paragraph of the new element's text (a paragraph of the same kind and attributes, without the spaces it would begin with; none where nothing is left), followed by the paragraphs below. The name is without the spaces at its two ends, and what is left before it is without the spaces at its end, as today.
3. **A selection over more than one paragraph**: the name is what is selected of the first paragraph (from where the selection begins to that paragraph's end), and every paragraph after the first, selected or not, goes whole into the new element's text. **A selection that begins at the very end of a paragraph and goes on into the next begins with the next**: someone who dragged over a whole line from the end of the line above means that line.
4. **What a name cannot hold is not lost**, as today: a name holds italics, small capitals, raised and lowered text and nothing else (`nameable`). Where what was to be the name holds a citation, a note, a picture, a formula, a reference mark, a line break or another mark, the name is left empty, and it becomes the first paragraph of the new element's text instead: the whole paragraph with nothing selected; with a selection, what is selected together with what follows it in the paragraph, as one paragraph. The toast says so, in words that fit both (below).
5. **Within what stands as one block** (a table, a text side by side with another), as today: the block stays whole, the name is empty, and what follows the block is the new element's text. A selection that is not of text (a picture selected, cells of a table, everything by Ctrl+A where that is not a text selection) is read as a cursor at its start, as today.
6. **Where the new element goes is as today** (`madeFrom`): the first under the element where it has elements under it or is the one in view, else after it; **Alt+Shift+Enter** the first under it. The cursor goes to the new name: at its end where it has words, at its start where it is empty. One step of undo takes it all back, as today.
7. **In a name, nothing changes**: Alt+Enter at its end makes an empty element after it, and in its middle gives the rest of the name to the new element (`splitName`).
8. **The entry of the right-click menu** (`text-split`, today *Split here*) and whatever else calls `split` (the tools over the text: `newElement('split')`; look for every caller and its words) do the same as the key, and say what happens: **Make the paragraph an element**, and with text selected **Make the selection an element**.
9. `headingAt(doc, from, to = from)` takes the selection's end; `split` passes it only for a `TextSelection` that is not empty. The whole only paragraph of a text made a name leaves an empty text: test that the old text ends as one empty paragraph and nothing throws.

### Choices the owner has not been asked about

- Items 3 (a selection over several paragraphs; one that begins at the end of a paragraph), 4 (what a name cannot hold is kept as a paragraph, with a selection too), 7 (a name as before) and the words of item 8.

### Words

`locales/en/text.ftl` and `locales/nb/text.ftl`. Read `locales/README.md` for what is done with a message whose meaning changes (a new name, so that an old translation is not shown for it, if that is the custom there).

- The menu: *Make the paragraph an element* / *Gjør avsnittet til et element*; *Make the selection an element* / *Gjør det merkede til et element*. *Split here* is no more.
- The toast (`text-heading-kept`): *What was to be the name holds what a name cannot, such as a citation or a note, and is the first paragraph of the new element* / the Bokmål in the words the present message uses.

### The scripts

**Thirty-nine e2e scripts press Alt+Enter or Alt+Shift+Enter** (`grep -ln "'Alt', 'Enter'\|'Alt', 'Shift', 'Enter'" e2e/*.mjs`). In the diagram and in a name nothing changes; **in a text with words in the cursor's paragraph, the key now takes that paragraph for the name**, where it made an empty element at the end of the paragraph before (see `e2e/maps.mjs` near *Honour is counted in prizes*, which checks exactly that). Go through every one of them: for each press, find where the cursor is; where it is in a paragraph of a text that holds words, change the script so that it still does what it means to (press Enter first, for an empty line, where an empty new element is meant; or change the check, where the rule itself is what is checked). Do not change a press that is in the diagram, in a name or in an empty text. List in your report every script and line you changed and why, and every script you looked at and left.

A new script **`e2e/paragraph-element.mjs`** (first comment: what it covers): in a text of three paragraphs, the cursor in the middle of the second and Alt+Enter: the second is the name of a new element, the third its text, the first stays; the same with the cursor at the end of a paragraph; Enter and Alt+Enter after the last paragraph gives an empty element with the cursor in its name and leaves no empty line behind; with words selected in the middle of a paragraph, they are the name, what stood before stays, what stood after is the first paragraph of the new text; Alt+Shift+Enter puts the new element under; Ctrl+Z takes one such step back whole; a paragraph with a bold word is kept as the first paragraph and the toast says why; the menu entry says *Make the paragraph an element* and, with a selection, *Make the selection an element*, and does it; no errors in the page. `e2e/text-structure.mjs` shows how sections, names and the cursor are found.

### Verify

- `heading.test.ts` rewritten for the new rule: every case of items 1 to 5 and 9, by what it shows.
- `pnpm check`, `pnpm test`.
- The guide: the rows of the table of the text's keys (*Make a heading at the cursor…*, *The same, with the new element under…*), the paragraph **A heading at the cursor** (rewrite and rename it for the new rule), the row of Alt+Enter in the table of all keys, and any other place that says what Alt+Enter does in a text (`grep -n "Alt+Enter" docs/guide.md`).
- Record `0108-a-paragraph-made-an-element.md`; in `docs/adr/README.md` its row, and in the row of 0062 that what Alt+Enter takes in a text became 0108's.

---

## Part C — the choosing of emojis

A widget of its own, used by the chat's field and by the reactions (part B), and by whatever wants emojis later. **New files only**, so that nothing of it meets part B's work; part B writes a stand-in at `src/lib/ui/EmojiPicker.svelte` with the same props, which yours replaces when the parts are merged.

### Decided

1. **`src/lib/ui/EmojiPicker.svelte`**, on `ui/Popover.svelte`, with exactly these props:

   ```ts
   interface Props {
     open: boolean;
     /** What it is opened at. */
     anchor: HTMLElement | null | undefined;
     /** Called with each emoji chosen. */
     onpick: (emoji: string) => void;
     onclose: () => void;
     /** Whether it stays open after an emoji is chosen, for choosing several; it closes after one otherwise. */
     stay?: boolean;
     side?: Side; // of './floating'; 'top' where not given
     align?: Align; // 'start' where not given
   }
   ```

2. **What it shows**: a row of tabs at its head, one for each group, each an icon of Lucide with the group's name as its tooltip and label; under it the emojis of the group chosen, in a grid of eight to a row, each a button of about 32 px with the emoji at about 20 px in `font-family: var(--font-emoji)` (the variable is in `src/app.css`), the grid scrolling within about 260 px. About 300 px wide. One group is shown at a time.
3. **The groups** are Unicode's own, in its order: **Smileys**, **People**, **Animals and nature**, **Food and drink**, **Travel and places**, **Activities**, **Objects**, **Symbols**; before them **Recently used**, shown, and the one opened at, only while there are any. The flags of countries are left out (Windows draws none of them); the few other flags (🏁 🚩 🎌 🏴 🏳️ 🏳️‍🌈 🏳️‍⚧️ 🏴‍☠️) stand last among the symbols.
4. **The emojis are generated, not typed**: from Unicode's `emoji-test.txt` (https://unicode.org/Public/emoji/latest/emoji-test.txt, or the file of a named version), by a script `scripts/make-emoji-list.py` that writes the list as a TypeScript module beside the picker; its head says the version and where it came from, and that it is not changed by hand. Taken: every `fully-qualified` emoji of **Emoji 14.0 or earlier** (the `E` number of its line), so that the fonts of the systems people have hold them; left out: the group *Component*, every emoji with a skin tone (U+1F3FB to U+1F3FF) and the flags of countries and regions. Fetching that one public file once is fine. Treat it as data that is not trusted: fetch it into a new empty directory of its own in the scratchpad you are given, keep the script elsewhere, hand the script the path, and run it with `python3 -I`. The file itself is not committed; the script and the module it wrote are.
5. **Recently used**: the emojis chosen last, the newest first, at most twenty-four, each once; kept on this computer from one opening of the application to the next. Read `src/lib/state/settings.svelte.ts`: where the interface keeps small things of its own there that need no change in Rust (as `recentProjects` is kept), keep them there; where that would need Rust, keep them for as long as the window is open, and say so in your report.
6. **Keys**: opened, the focus is on the first emoji of the group shown; the arrows move through the grid, Home and End to the ends of a row, Enter and Space choose; Tab goes between the tabs and the grid, and the arrows left and right move among the tabs; Escape closes (see what `Popover` does of itself, and that the focus goes back to where it was). With `stay`, the focus stays where it is after a choice.
7. **For the scripts and tests**: `data-emoji-picker` on its root, `data-emoji-group="<id>"` on each tab (`recent`, `smileys`, `people`, `nature`, `food`, `travel`, `activities`, `objects`, `symbols`), `data-emoji="<the emoji>"` on each button.
8. **Not done**: no finding by name (it would need the names of every emoji in every language of the interface); no skin tones; no flags of countries.

### Words

A part of its own: `locales/en/emoji.ftl` and `locales/nb/emoji.ftl` (read `locales/README.md` for whether a part must be named anywhere else). `emoji-title = Emojis` / `Emojier`; `emoji-recent = Recently used` / `Sist brukt`; `emoji-smileys = Smileys` / `Smilefjes`; `emoji-people = People` / `Mennesker`; `emoji-nature = Animals and nature` / `Dyr og natur`; `emoji-food = Food and drink` / `Mat og drikke`; `emoji-travel = Travel and places` / `Reise og steder`; `emoji-activities = Activities` / `Aktiviteter`; `emoji-objects = Objects` / `Gjenstander`; `emoji-symbols = Symbols` / `Symboler`.

### Verify

- A test beside it (`EmojiPicker.test.ts`, and one of the list): every group has emojis and none stands twice; no emoji of the list holds a skin tone; a choice calls `onpick` and closes, or stays with `stay`; what is chosen stands first among the recently used; the arrows move the focus; the tabs show their groups.
- `pnpm check`, `pnpm test`.
- No record, no guide and no e2e script: part B writes the chat's, and names the picker in them. Say in your report what part B's record should say of your choices.

---

## Part B — the chat answered, set, marked and changed (record 0107)

> In the shared project chat, it would be nice with some adjustments: Answering specific messages, which then are placed as answers to them. Formatting in the chat text, at least bold, italics etc. Emojis. A mark telling who has read the message. Possibility to edit the text.

Asked, the owner chose that **an answer stands under the message it answers**, however old that message is (not at the foot with the message quoted), and that **emojis are in the text and reactions to a message**. The chat as it is: record 0092 and `src/lib/chat/`, the model in `src/lib/project/model/changing/chat.ts`; what is written and not sent: record 0094 and `project/drafts.svelte.ts`. Read both records first.

### Decided: what is kept in the project

1. **A message gains three things**, each left out where it has none, so that a message of today is read as before and an earlier version of the program shows the new ones as plain words:

   ```ts
   export type ChatMarkKind = 'strong' | 'em' | 'underline' | 'strike' | 'code';
   /** How a stretch of a message's words is set: from a sign of `text` up to another (UTF-16 offsets). */
   export interface ChatMark { from: number; to: number; mark: ChatMarkKind }

   export interface ChatMessage {
     id: string;
     author: { id: string; name: string };
     created: string;
     /** When its author last changed it, where they did. */
     edited?: string;
     /** The message it answers: one that answers none itself. */
     to?: string;
     /** Its words, plain, with their line breaks. */
     text: string;
     marks?: ChatMark[];
   }
   ```

   `chatMessageOf` reads all of it with care: a mark of an unknown kind, or outside the words, is dropped, not the message.
2. **`say(what, to?)`** takes the words alone, as today, or the words with their marks, and the id of the message answered. **An answer to an answer answers what that one answered**: `to` is always a message that answers none, so answers are one deep. Where the message answered is not there, the message is said as one that answers none. The cut at 4,000 characters cuts the marks with the words.
3. **`reword(id, what)`** changes one's own message, and nobody else's (the model refuses): the plain object is replaced where it stands (deleted and put in again in one transaction, with the origin `CHAT`), its id, author, `created` and `to` kept, `edited` set to now. Nothing happens where neither words nor marks differ, or the words would be empty. Where two copies of one message with one id come about (its author changing it on two computers at once), the one changed last is read and the other left out.
4. **Who has read what is kept in the project**, in a map of its own in the document, `chatRead`: for each person (by their id) their name, the message they read last (its id and its `created`, as the mark on this computer has them, `ReadMark` in `chat/reading.ts`) and when. **`markChatRead(mark)`** writes one's own entry where it differs. The mark kept with the view on this computer (`OpenProject.chatRead`) stays what counts the unread; the one in the project is what tells the others.
5. **Reactions are kept in a map of their own**, `chatReactions`, one entry for each person's one emoji on one message (a key of the message's id, the person's id and the emoji; the value their name and when), so that two people who react to one message at once both stay. **`react(id, emoji)`** puts one's own there, or takes it away where it is there. Anyone reacts to any message, their own too, with as many different emojis as they like. What is not an emoji is not read as one (another copy may have written anything): a short string that holds a pictograph.
6. `project.chat`, and beside it the readers and the reactions as plain lists, each **read again when its own part of the document changes and only then**, never on a keystroke in the text. All three are outside undo, with the origin `CHAT`, as the messages are. `clearChat` empties all three. A message taken back keeps its reactions in the map, so that *Undo* brings them back with it.
7. **The history makes no session of any of it** (`history/engine.ts`, `#aside`): a record all of whose changes are in the chat, in who has read, in the reactions, or among who deleted what, is left out, as a message is today. **This matters**: a mark of who has read is written each time someone reads, and each would otherwise be a session. Look at everything else that names the chat or lists the parts of a project's document (`grep -rn "chat" src/lib/history src/lib/project/model`): the two new maps go with the chat everywhere (carried by a duplicate and a project saved as a file; not written as Org, not carried with elements copied to another project, not searched).

### Decided: answers

8. **An answer is placed under the message it answers**, after the answers already there, in the order they were written, set in from the left with a thin line at its left. The messages that answer none stand in the order they were written, as today, each with its answers under it: nothing ever moves.
9. **Under one name**: messages of one person within five minutes on one day stand under one name, as today, among the messages that answer none (a message that has answers ends its group: what follows it begins a new one) and, apart from that, among the answers to one message.
10. **The time**: an answer written on another day than the day line it stands under shows its date with the time of day (short); the day lines follow the messages that answer none.
11. **Answers whose message was taken back stay together**, where the first of them stood, under a quiet line in its place, *A message that was deleted*; *Undo* of the deleting puts the message back over them.
12. **Answering**: *Answer* on a message (the tools on it, and its right-click menu). The field at the foot is where it is written: over it a line says *Answer to Name*, with the first words of that message (`firstWords`) and a × that gives the answering up; the cursor goes to the field. Pressed on an answer, the line names that answer and its writer, and what is sent answers the same message as it did. Sent, the answer is brought into view where it is not. Escape in the field gives the answering up and keeps what is written.

### Decided: the field, and how words are set

13. **The field is a small editor of ProseMirror of its own**, not bound to the project's document: lines of text with the marks **bold, italic, underlined, struck through and code**, drawn as the text's editor draws them (share the specs of the marks in `editor/schema.ts` where they can be shared, as `titleSchema` does). Enter sends; Shift+Enter is a new line; the marks by the keys they have in the text (read `editor/keys.ts` and the plugins; do not invent keys). It grows with what is written to about 160 px and then scrolls, has the placeholder *Write a message*, and keeps `data-chat-field` on what is written in.
14. **Undo in the field is its own.** `prosemirror-history` is not among the dependencies and is not added: give the field a small undo of its own (the states kept as it is written in, a pause making a step; the texts are a few lines) under Ctrl+Z, Ctrl+Shift+Z and Ctrl+Y. These keys, in the field, never reach the project's undo: Ctrl+Z in the chat must not take back what was written in the text (look at how `shell/keys.svelte.ts` and the views treat keys from a field).
15. **Pasting** comes through the window's own path on Linux (`src/lib/util/paste.ts`, record 0048), which gives the paste again with what was read: what is pasted keeps its line breaks and those of the five marks it has, and everything else of it comes as plain words. Nothing but text is put in a message.
16. **Under the field, one row**: at the left small buttons for the five marks (Lucide `bold`, `italic`, `underline`, `strikethrough`, `code`), each shown as pressed while its mark is on where the cursor is, with the mark's name and key in its tooltip (use the words the text's tools have for them, if they have); then the button of the emojis (Lucide `smile`), which opens `EmojiPicker` with `stay` and puts each emoji chosen where the cursor is; at the right *Send*, as today.
17. **A message is drawn from its words and marks**, never as HTML: stretches of text within `strong`, `em`, `u`, `s` and `code`. **An address of the web** in the words (`http://` or `https://` to the next space) is shown as a link, which opens in the system's browser the way links are opened elsewhere in the application (find it; do not add a way). **A message of one to three emojis and nothing else is shown larger.** The words of a message are set with `var(--font-emoji)` after the font of the interface.
18. **What is written and not sent is kept as before** (record 0094), under the same field of the project's drafts, now with its marks, and with what it answers or changes: as JSON in the string the drafts keep. What an earlier version kept there, plain words, is read as words. Where nothing is written and nothing is answered or changed, the field is dropped from the drafts, so that nothing empty is kept from one opening to the next. An answering whose message is gone becomes a message that answers none; a changing whose message is gone is given up.

### Decided: changing one's own message

19. ***Change*** in the menu of one's own message, while the project is shared: the field takes its words and marks, a line over it says *Changing a message*, with a × that gives it up; **Enter keeps the change, Escape gives it up**. What was being written before comes back when the change is kept or given up. A message that was changed says ***changed*** after its words, small and quiet, with when in its tooltip. It is not unread again for anyone, and nothing is told of it.

### Decided: who has read, and reactions

20. **Each message shows who has read it**: the small circles of those people, with their initials on their colour (`colourOf`, `initials`, as the names have them), at the right end of the message, at its last line, taking no line of their own: everyone who has read it except its writer and oneself; at most three, then `+n`; the tooltip says *Read by* and their names (`Intl.ListFormat` in the language of the interface). Someone has read a message when the message they read last is that one or one written after it; where that message has been taken back since, by when it was written.
21. **One's own mark is written** by `ChatHost`, where it marks the chat read today (shown, with the window in front), while the project is shared.
22. **Reactions stand under the words of a message** as small chips, an emoji and how many gave it; one's own is told apart by the accent colour; the tooltip names who. Pressing a chip gives or takes back one's own of that emoji. ***React*** among the tools of a message opens `EmojiPicker` (closing after one) at the button. Nothing is told of a reaction, and it makes nothing unread.
23. **The tools of a message** come when the pointer is on it or the focus within it, at its top right, **over** the message and not beside it, so that they take no room: *React* (Lucide `smile-plus`), *Answer* (Lucide `reply`), and on one's own the three dots, whose menu has *Change* and *Delete*. The right-click menu of a message has *Answer*, *React…*, and on one's own *Change* and *Delete*. **While the project is not shared** nothing can be written: no *Answer*, no *React*, no *Change*, and a chip cannot be pressed; one's own message can still be deleted, as today.

### Decided: finding what is new

24. Answers are placed under old messages, so what is new is no longer always at the foot. **What is new is marked and led to**:
    - `ChatHost` knows, for each project, the messages that are **new**: those of others that were unread when its chat came to be shown, and those of others that arrive while it is shown. They are no longer new once the chat is not shown (another tab, the pane closed, another project), and when one sends a message oneself.
    - **A new message has a thin bar of the accent colour at its left.**
    - **When the chat comes to be shown**, the first new message, as they stand, is brought into view, near the top of the list; with none, the list is at its foot, as today.
    - **A small button over the foot of the list**, in its middle, is there while new messages have not been within what is shown of the list: an arrow up or down (Lucide `arrow-up`, `arrow-down`) and *1 new message* / *n new messages*; pressed, it goes to the nearest of them that way. A new message is counted as seen once it has been within what is shown. This holds for a message at the foot too, when the reader has gone up.
    - The list still stays at its foot when a message arrives there while it is at its foot.

### Choices the owner has not been asked about

- Answers one deep (2); answers of a message taken back kept together under a line (11); the answer written in the field at the foot under a line that names what is answered, not in a field under the message (12).
- The five marks, their buttons, and no signs typed for them (13, 16); links and larger emojis (17).
- A change written in the field at the foot; *changed* after the words (19).
- Who has read is shown on every message as circles, without oneself and the writer (20), and is kept in the project, so that everyone who shares it sees when one has read; it cannot be turned off.
- Reactions by anyone on any message, as many as one likes, told to nobody (5, 22).
- How what is new is marked and led to (24).
- No finding by name among the emojis, no skin tones, no flags of countries (part C).

### Not done

- No answers to answers shown as such; no naming of a person in a message; no spelling in the field; nothing told of a reaction or a change; an edited message is not unread again.
- The unread are still counted by the mark of this computer alone: read on one computer, a message is unread on another of the same person until it is shown there.

### Words

`locales/en/chat.ftl` and `locales/nb/chat.ftl`; the chat is *Samtale* in Bokmål. The comments say *Answer…* / *Svar …*, *Change* / *Endre*, *changed* / *endret*: the chat says the same.

- `chat-answer = Answer` / `Svar`; `chat-react = React` / `Reager`; in the right-click menu `chat-react-choose = React…` / `Reager …`; `chat-edit = Change` / `Endre`; `chat-edited = changed` / `endret`.
- `chat-answering = Answer to { $name }` / `Svar til { $name }`; `chat-editing = Changing a message` / `Endrer en melding`; the × of both: `common-cancel` if that is what such a × says elsewhere, else a word of the chat's.
- `chat-gone = A message that was deleted` / `En melding som ble slettet`.
- `chat-read-by = Read by { $names }` / `Lest av { $names }`.
- `chat-new = { $count -> [one] 1 new message *[other] { $count } new messages }` / `1 ny melding`, `{ $count } nye meldinger`.
- `chat-emoji = Emojis` / `Emojier` for the button of the field. The marks: the names the text's tools have, if they have them; else `chat-mark-…`.
- The line under the messages of a project that is not shared, and everything else that is there, stay as they are.

### The stand-in for the picker

Part C builds `src/lib/ui/EmojiPicker.svelte` with the props given there. **Write a stand-in at that path with exactly those props**: a `Popover` with a dozen emojis in a row and the attributes `data-emoji-picker` and `data-emoji`, no words, no other file. It is replaced by part C's when the parts are merged: put nothing else of yours in `src/lib/ui/` that has to do with emojis, and no words in `emoji.ftl`.

### Verify

- **The model** (`model/chat.test.ts`): an answer and an answer to an answer both answer the first; an answer to what is not there answers none; `reword` on one's own keeps id, place, author and `created` and sets `edited`, refuses another's, and reaches a second copy as one message; two copies reacting to one message at once both stay, and a second press takes one's own away; the readers of two copies; the careful reading (marks out of range, an unknown kind, a reaction that is no emoji); the cut with marks; `clearChat` empties all three; undo in the text takes none of it back.
- **Reading** (`chat/reading.test.ts`): the messages with their answers under them; under one name; answers of a message taken back; who has read a message, with a mark whose message is gone; what is new and what of it is unseen.
- **What is written** (a test of its own): the words and marks of the field to a message and back again, with line breaks, marks that overlap and marks at the ends; the stretches a message is drawn as; the links; the larger emojis; the draft as JSON and an earlier draft of plain words.
- **The panel** (`chat/ChatPanel.test.ts`, kept passing and added to): an answer under its message; *Change* and *changed*; a chip and its press; the circles of who has read; the tools by whether the project is shared and whose the message is; the button of what is new.
- **The history** (`history/engine.test.ts`): a mark of who has read alone, and a reaction alone, make no session.
- `pnpm check`, `pnpm test`. Nothing may do work in proportion to the whole text of a project on a keystroke in it: everything of the chat depends on the chat alone.
- **The script** `e2e/chat.mjs` is kept passing (its field is no longer a `textarea`: see how it types and reads), and a new one, **`e2e/chat-answers.mjs`**, with the real server and the program twice as `chat.mjs` has them: an answer stands under its message for both, and an answer to the answer after it; bold by its key in the field is bold for the other; an emoji chosen from the picker stands in the message; a reaction given by one is shown to both with its count, and taken back; the writer sees the other's circle on their message once the other has shown the chat, and not before; a message changed says *changed* for both; with the list at its foot and an answer arriving far up, the button of what is new is there and leads to it; what is written with a mark and an answering is there again after another tab; in Norwegian the new words are Norwegian; no errors in the page. Say in the first comment what it covers.
- **The guide**: the part about the chat, rewritten for all of this, and the keys of the field where the guide lists keys.
- **Record** `0107-the-chat-answered-set-marked-and-changed.md`; in `docs/adr/README.md` its row, the row of 0092 (*holds in part*: a message can be changed, and who has read is kept in the project too) and the row of 0094 (what is kept of the chat's field now holds its marks and what it answers or changes).

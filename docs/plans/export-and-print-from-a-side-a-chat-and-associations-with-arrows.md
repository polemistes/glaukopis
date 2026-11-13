# Export and print from a side, a chat, and associations with arrows — the build plan

From the owner's words of 2026-11-13 (the last section of `docs/brief.md`). Three parts that do not depend on one another, each built by one agent in a working copy of its own, each with a record of its own:

| Part | Record | Branch's work |
| --- | --- | --- |
| A | 0091, export and print from the bar of a side | `src/lib/print/`, `src/lib/project/SideBar.svelte`, a small part of `ProjectView.svelte`, the keys |
| B | 0092, a chat in a shared project | `src/lib/chat/` (new), the model, the document pane's tabs |
| C | 0093, associations with arrows, colours and words in lines | the model's links, the diagram, the text's margin, Org, the mind maps, search |

**No part changes Rust.** Everything is in `src/`, `locales/`, `docs/` and `e2e/`. If you find you need a change in `crates/` or `src-tauri/`, stop and say so in your report instead of making it.

## How each part is built

Read `CLAUDE.md` (the map) and `.claude/briefs/common.md` (the progress note, the languages, the rules), then your part below, then the code it names. Nobody answers questions while you build: where something is open, choose the plainer thing, write the choice in your progress note and in the record, and go on.

- **Your working copy is a git worktree** on a branch of its own. Begin with `pnpm install --frozen-lockfile --prefer-offline` (it has no `node_modules`). Commit on your branch after every step that passes `pnpm check`; never push, never merge, never touch `main` or another working copy.
- **Verify with `pnpm check` and `pnpm test`**, and `pnpm format` after your edits are done (edit first, format after; Prettier over `src/` only). **Do not run cargo, `pnpm e2e:build` or any e2e script**: your working copy has no `target/`, and three builds at once would run the machine out of memory. Write the e2e script your part names, as carefully as you can from the scripts beside it and `e2e/harness.mjs`, and say in your report that it has not been run. It is run, and mended, after the three parts are merged.
- **Words**: every word the user sees is a Fluent message in `locales/en/` and `locales/nb/`, written together, plain and few (`.claude/briefs/words.md` has the glossary; `locales/GLOSSARY.md` too). The other languages are not touched. No hints in menus.
- **The guide**: write what the user can now do into `docs/guide.md`, in the guide's own voice, in the section where the part is described today; change what is no longer true.
- **The record**: write `docs/adr/00NN-….md` in the form of `0089` and `0090` (read one): the owner's words, the context, the decision, *choices made in building this, which the owner has not been asked about* (the ones this plan lists, and yours), what is not done, as built. Add its row to the table of `docs/adr/README.md`, and change the rows of the records it amends.
- **Large files** (`ProjectView.svelte`, `MapDiagram.svelte`, `MapText.svelte`): put what is new in a module or a component of its own and call it from there; add as little as you can to the large file.
- **The commit trailer** is the model you are: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` or `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- **Your report**, as the common brief says: what was built and where, every choice you made, what `pnpm check` and `pnpm test` said (the numbers), what is not verified, and anything you are unsure of. Say plainly what you did not finish.

---

## Part A — export and print from the bar of a side (record 0091)

> A user has asked if export and print could be reached without opening the typesetting pane.

Today *Export* is a button in the head of the typesetting pane and nowhere else, and Ctrl+P opens the pane before it prints (record 0075, choice 4, never confirmed by the owner). The pane takes half the window; someone who writes in the text and only wants the file or the paper has no use for it.

### Decided

1. **Two buttons on the bar of a side that shows a project** (`SideBar.svelte`), after *Typesetting* and before *Document*: **Print…** (Lucide `printer`, Ctrl+P in its tooltip) and **Export…** (Lucide `share`, as the pane's button has; Ctrl+E in its tooltip). Icons with tooltips, as the rest of the bar. They are always there, never hidden.
2. **They act on the document of that side**: the element marked as the document where the project has one, else the element in view, exactly what the typesetting pane would show for the side (`documentOf` in `project/layout.ts`, as `ProjectView.svelte` computes `typesetAt`).
3. **Print no longer opens the pane.** Where the typesetting pane is open and shows this side's document, printing goes through the pane as today (its pages are made). Otherwise the document is set out of sight and printed:
   - `documentRequest(project, projectId, at)` builds the request (`preview/documents.svelte.ts`); it is set with `documentPreviewWhole({ ...request, key }, [])` under **a key of its own**, `` `${projectId}-print` ``, so that the pane's kept document of the same project is not replaced (the core keeps a set document per key, and makes any key safe for a folder name);
   - the pages are fetched with `documentPrintPages(key, from, to)`, 24 at a time, and handed to `printPages` (`print/pages.ts`), exactly as `PreviewPanel.print` does today;
   - **`documentPreviewStop(key)` is called in a `finally`**, always: the core would otherwise keep the set document of a whole book in memory (record 0087);
   - a toast says at once that the pages are being prepared (the setting of a long book takes seconds, and nothing else on the screen says anything happens), replaced by the one that counts the pages, as today; where the document cannot be set, a toast says so with the core's message (`notifyError(t('preview-print-failed'), e)`), and nothing prints;
   - never twice at once: a second press while one printing is prepared does nothing.
   Put this in a module of its own, `src/lib/print/document.ts` (a plain function; no Svelte component is needed), and have `PreviewPanel.print` and the new function share what they can (the fetching of the pages in batches and the handing over) rather than keep two copies.
4. **Export opens the export dialog** (`preview/ExportDialog.svelte`, unchanged) over the window for the side's document, with the pane open or not: `request` is `() => documentRequest(project, projectId, at)`, `name` the document's title, `targets` those of the template the document uses (`templateUsed(project, at)`, its output `document`, as `PreviewPanel` passes them). `documents.load()` must have been called before the dialog shows what LaTeX is installed. The dialog is hosted by a small component of its own beside `ProjectView.svelte`, not written into it.
5. **Keys** (`shell/keys.svelte.ts`): `print` stays Ctrl+P and now prints without the pane; a new entry **`export`, Ctrl+E**, place `project`, bound in `ProjectView.svelte` beside `print`, only while a side that shows a project is active. The palette and the sheet of keys list it by `keys-export` (`keys.ftl`). On a file side Ctrl+P prints the file as before and Ctrl+E does nothing.
6. **The pane keeps its own two buttons.**
7. **The test hook** `window.__glaukopisPrint.toFile(path)` is mounted where it is always there (not in `PreviewPanel`, which may be closed) and prints what Ctrl+P would print, to a file with no dialog.

### Choices the owner has not been asked about

- Buttons on the bar rather than entries in a menu: the bar of a file side has its Print there already, and a button is found without being looked for. The bar wraps to a second row sooner in a narrow side.
- Ctrl+E for export.
- Print with the pane closed sets the document a second time out of sight (the reverse of 0075's choice 4), and lets go of it when the printing is handed over.

### Words

`project.ftl`: `project-bar-print = Print…` / `Skriv ut …`; `project-bar-export = Export…` / `Eksporter …`; one message for the toast before the pages are counted, e.g. `project-print-setting = Setting the pages…` / the Bokmål the typesetting pane uses for setting pages (look at `preview.ftl` in `nb`). `keys.ftl`: `keys-export = Export` / `Eksporter`. Follow how the existing bar labels and key names are written.

### Verify

- `pnpm check`, `pnpm test`; a vitest for whatever of `print/document.ts` can be tested without the core (the batching, the `finally`), with the API calls mocked as other tests in `src/lib` mock them.
- `e2e/print.mjs` is changed, not run: the check *Ctrl+P opens the typesetting pane where it is closed* becomes *Ctrl+P with the pane closed prints, and the pane stays closed* (print to a file through the hook and count the pages with `pdfinfo`, as the script does for the pane); a check that the bar's *Print…* does the same; a check that the bar's *Export…* and Ctrl+E open the export dialog with the pane closed (look at how `e2e/preview.mjs` or `e2e/documents.mjs` gets past the save dialog when it exports, and export one file that way if they do); the palette finds *Export* with Ctrl+E.
- The guide: the section on printing and exporting, and the table of keys if the guide has one.
- The record 0091 amends 0075 (choice 4 and *From the typesetting pane, and with Ctrl+P*) and 0064 (the bar).

---

## Part B — a chat in a shared project (record 0092)

> Also, there should be a chat for shared projects.

Those who share a project see who is there (`sharing/Presence.svelte`) and can comment on an element or a passage (record 0024), but cannot say anything to each other about the work as a whole, or simply talk.

### Decided

1. **The messages are kept in the project's own document**, a Yjs array `doc.getArray('chat')` of plain objects `{ id, author: { id, name }, created, text }`, as a note of a comment is (`model/types.ts`, `Note`; `model/changing/comments.ts`). They therefore reach everyone through the server as every other change does, **with no change to the server and none to the protocol**; they are there for someone who opens the project the next day; a message written while the server cannot be reached is sent when it can. A version of the application that does not know the chat carries it untouched.
2. **Outside undo**: written with an origin of its own (`CHAT` in `model/origins.ts`, as `COMMENTS`), and the array is not in the scope of the undo manager. Ctrl+Z in the text never takes a message back.
3. **The model** (`model/changing/chat.ts`, methods of `Project` as the other `changing/` files are; `project.chat` a `$state.raw` list read on change, as `links` is): `say(text)` (trimmed; nothing for an empty one; at most 4000 characters), `unsay(id)` (one's own message), `clearChat()`. The author is `project.me`, as a note's author is.
4. **A tab of the document pane, *Chat***, last among the tabs (`DocumentTab` and `TABS` in `project/sides.svelte.ts`, `SideTabs.svelte`, the branch in `ProjectView.svelte` where the panels are chosen). The tab is there **while the project is shared, or holds messages**; where neither, it is not shown, and a pane kept at the chat shows the references instead. The panel is `src/lib/chat/ChatPanel.svelte`, with the pane's tabs as its head, as `CommentsPanel` has them.
5. **The panel**: the messages from the oldest to the newest, the newest at the foot, each with who wrote it (their initials on their colour, `initials` and `colourOf` of `sharing/connection.svelte.ts`, as the cards of comments show a person, and the name), when (the time of day; a line with the date where the day changes; written by `Intl.DateTimeFormat` in the language of the interface, as other dates in the interface are), and what it says, with its line breaks kept and selectable. One's own messages are told apart quietly (look at how the comments tell one's own notes apart; do the same). Consecutive messages of one person within a few minutes stand together under one name. Under them a field of several lines that grows with what is written: **Enter sends, Shift+Enter makes a new line** (as Shift+Enter is the line break everywhere in the application), and a *Send* button. The panel stays at the foot when a message arrives while it is at the foot; where the reader has gone up, it stays where it is.
6. **One's own message can be taken back**: a menu on the message (as a note of a comment has), *Delete*. Nobody deletes another's message while the project is shared. Messages are not edited.
7. **While the project is not shared** but holds messages (the sharing was ended, or the project came as a file), the tab shows them, the field is not there, and the head has *Delete the conversation*, asked about before it is done (the dialog the application uses for such questions). So a conversation never travels unseen in a project, and can be taken out of it.
8. **Unread messages**: which message was read last is kept on this computer with the project's view, where the mark of the document is kept (`project/layout.ts`, `StoredView`; follow the mark through the code and do the same). Messages of others that are newer count as unread until the chat is shown with the window in front. The count stands on the *Chat* tab (`SideTabs` has `counts` for the citations found; use it) and as a small dot on the **Document** button of the side's bar (`SideBar.svelte`), so that it is seen with the pane closed.
9. **A message that arrives is told**: when a message of another arrives while the project is open and its chat is not shown, a toast says `{name}: {the first words}` with the action *Show*, which opens the document pane at the chat for that project. Where several arrive at once (the first exchange with the server after a time away), one toast says how many. Nothing is told of one's own messages written in another window, nor of messages that were there when the project was opened and have been read.
10. **A key entry `side-chat`** with no key of its own (`shell/keys.svelte.ts`, as `what-document` has none), bound beside `side-comments`: the palette lists *Chat*. It is there only while the tab is.
11. **Not part of anything written**: the chat is not typeset, not exported, not written into the Org copy (`src/lib/org/`), not searched, and not carried when elements are copied to another project (`model/portable.ts`). Check that the history panel (`src/lib/history/`) and the review of changes (`src/lib/review/`) do not count a message as a change of the text or show it as one; say in your report what they do with it, and with a comment.

### Choices the owner has not been asked about

- Kept in the project and for good, rather than told only to those who are there at the moment (which needs nothing kept, but is of little use to people who seldom work at the same hour).
- A tab of the document pane rather than a window or a pane of its own.
- The toast on arrival, and the dot on the Document button.
- Enter sends.
- A duplicated project, and a project saved as a file, carry the conversation; the Org copy does not, so a project read back from Org is without it.
- *Delete the conversation* only while the project is not shared.

### Words

A part of its own: `locales/en/chat.ftl` and `locales/nb/chat.ftl`, names beginning `chat-`; `keys-side-chat` in `keys.ftl`. *Chat* in Bokmål: look in `locales/nb/` and the glossaries for a word already used for talk between collaborators; where there is none, *Samtale* for the conversation and the tab.

### Verify

- `pnpm check`, `pnpm test`. Vitests beside the code: the model (`say`, `unsay`, `clearChat`; two `Project`s or two Yjs documents exchanging updates see each other's messages in order; undo after `say` does not remove the message; a message of 5000 characters is cut), and whatever of unread counting and grouping is a plain function (make them plain functions in `src/lib/chat/` so that they can be tested).
- `e2e/chat.mjs`, written and not run, from `e2e/sharing.mjs` (the real server, the application twice): the owner shares, the guest joins; neither has the tab before the sharing, both have it after; the owner writes a message, the guest gets the toast and the dot, opens the chat by *Show*, sees name and words, the dot goes; the guest answers with two lines (Shift+Enter), the owner sees both lines; the owner deletes their message and it goes for both; Ctrl+Z in the guest's text does not remove a message; the guest closes and opens the project and the messages are there. Screenshots of the panel of each into `e2e/output/`.
- The guide: the section on working together.

---

## Part C — associations with arrows, colours and words in lines (record 0093)

> And it would be nice if the associations could have arrows and colours. And the label of the arrows should be text fileds that can have more than one line.

An association (`LinkRecord` in `model/types.ts`: `id`, `from`, `to`, `label`) is today one dashed gold curve between two elements in the diagram (`diagram/lines.ts`, `diagram/layout.ts` `associationCurve`, drawn in `MapDiagram.svelte`), a bracket in the margin of the text (`text/layout.ts` `bracketsOf`, drawn in `MapText.svelte`), with a few words on it written in a one-line field, every whitespace made one space (`model/changing/links.ts`).

### Decided

1. **An association may have an arrow**: at the end it goes to, at the end it comes from, at both, or none. Kept as `arrow` on the link in the document: `'to' | 'from' | 'both'`, absent for none. **None is what a new association has**, and what every association made before has: nothing changes for those who do not want arrows. The program assigns no meaning to the direction; it is the writer's.
2. **An association may have a colour**: one of the colours a kind of element can have (`KIND_COLOURS` in `project/kinds.ts`), kept by its name as `colour` on the link; absent for the gold it has today. The curve, the arrowheads, the words and the bracket in the margin take it.
3. **Its words may be in several lines.** `setLinkLabel` keeps line breaks: spaces and tabs within a line become one space, each line is trimmed, empty lines at the beginning and the end go, and three or more line breaks in a row become two. The field the words are written in, in the diagram and in the margin of the text, is a field of several lines that grows with what is written: **Enter says it is done, Shift+Enter makes a new line** (as everywhere in the application), Escape leaves it as it was, and leaving the field keeps what was written. The words are drawn with their lines, centred on the middle of the curve, no wider than some 240 pixels, a longer line broken.
4. **One menu of an association**, the same in the diagram and in the margin of the text, built in one place (a module such as `src/lib/project/associations.ts`, tested) and opened by both:
   - in the text's margin, first the two *Go to …* entries it has today;
   - *Add words* / *Change the words* (the messages the margin's menu has today);
   - **Arrow ▸**: *None*, *To {name of the element it goes to}*, *To {name of the element it comes from}*, *Both ways*, the one that holds checked; icons from Lucide (`minus`, `arrow-right`, `arrow-left`, `arrow-left-right`, or what fits better);
   - **Colour ▸**: *None* and the ten colours by their names (the messages `kinds-colour-…` name them already), each with its dot (`colour` of a `MenuItem`), the one that holds checked;
   - *Remove the association*.
   In the diagram the menu opens on a right click on the curve or its words (which also selects it), and by the menu key while an association is selected; a click still selects, a double click still writes the words, Delete still removes.
5. **Drawing in the diagram.** An arrowhead is a small filled triangle (some 10 pixels long, 8 wide) at the point where the curve meets the box, turned as the curve arrives there; drawn as a path of its own computed in `associationCurve` or beside it (not an SVG marker: the picture of the diagram reads the paths, and `context-stroke` is not to be relied on in WebKitGTK). Tested as the curve is (`layout.test.ts`). An association whose end is folded away is drawn faint to what it is folded under, as today, with its arrowhead.
6. **Drawing in the text's margin.** The bracket takes the colour; an end the arrow points at has a small arrowhead towards the text in place of its dot. The tooltip says `A → B`, `A ← B`, `A ↔ B`, and `A – B` for no arrow (it says `↔` for every association today, which would now mislead), then the words, their lines joined by spaces.
7. **Everything that carries an association carries all of it**:
   - copies within a project and between projects (`cloneLinks` in `model/changing/elements.ts`, `model/portable.ts`);
   - **the picture of the diagram** (`diagram/picture.ts`, SVG and PNG): the colour comes with the stroke it reads; the arrowheads and the lines of the words must be drawn (`e2e/diagram-picture.mjs` and the tests beside `picture.ts` show how it is tested);
   - **Org** (`src/lib/org/`: `types.ts`, `properties.ts` `LINKS`, `read.ts`, `write.ts`, `of-project.ts`): a line break in the words is written as `\n` within the link's description and read back (a backslash before any other sign stays as it is read today); arrow and colour follow the link in braces, `[[id:…][words]]{to teal}` (the arrow word `to`, `from` or `both`, and the colour's name, either or both, nothing where there is neither). A file written before reads as it did, and a reader of before skips the braces. Where the Org form is described (`docs/` or a comment at the head of `properties.ts`), describe this. Round-trip tests in `src/lib/org/`.
   - **the mind maps** (`src/lib/mindmaps/`: `map.ts` `Association`, `crossing.ts`, `freeplane.ts`, `xmind.ts`): Freeplane's `arrowlink` has `STARTARROW` and `ENDARROW` (`None` or `Default`) and `COLOR` (`#rrggbb`), written and read; a colour read is brought to the nearest of the ten, as `crossing.ts` does for kinds; a line break in a label is kept where the format keeps it. XMind: write and read the arrows and the colour of a relationship if you know its format for certain (the properties of a relationship's style); if you do not, leave XMind as it is and say so in the record. OPML has no associations.
   - **search** (`src/lib/search/everything.ts`, and where `search-where-association` is written): the words are found whatever line they are in; the ends are written with the arrow as in 6.
8. **One association between two elements**, as today: `addLink` gives back the one that is there, whichever way it was drawn. *Both ways* is the arrow for a relation that goes both ways.

### Choices the owner has not been asked about

- No arrow and gold for a new association; the arrow and the colour are given in its menu.
- The ten colours of the kinds rather than any colour.
- Enter is done, Shift+Enter a new line.
- `–` between the ends where there is no arrow, in the tooltip and in search.
- The form in Org.

### Words

In the files of the parts they are shown in (`diagram.ftl`, `text.ftl`, `project.ftl`), following where the neighbouring messages are; the menu's own words in one part, used by both views. Bokmål with them. Messages that are no longer used are removed from both languages (the tests say which names are used).

### Verify

- `pnpm check`, `pnpm test`. Vitests beside the code: the model (arrow, colour and lines kept, cleaned as 3 says, copied by `cloneLinks` and by the portable copy; an old link without the fields reads as no arrow and no colour), the arrowhead's geometry, the menu's items, Org and Freeplane round trips, the search.
- `e2e/associations.mjs`, written and not run, from `e2e/maps.mjs` or `e2e/diagram-picture.mjs`: two elements associated by the menu; words of two lines written with Shift+Enter and shown as two lines; an arrow given by the menu and an arrowhead drawn; a colour given and the curve's stroke that colour; the same association in the text's margin with its arrowhead and colour, and its menu there; the picture of the diagram as SVG holding the arrowhead and both lines; undo takes each change back. Screenshots into `e2e/output/`.
- The guide: where associations are described for the diagram and for the text (search it for *association*), and the parts on Org and on mind maps of other programs.

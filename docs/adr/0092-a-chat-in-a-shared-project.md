# 0092 — A chat in a shared project

Date: 2026-11-13. Status: built on 2026-11-13, its choices not yet confirmed by the owner; from the owner's words of the same day ("Also, there should be a chat for shared projects.").

## Context

- **Those who share a project could see who is there** (the small sign with people in the head of the document pane), and **comment on an element or a passage** (0024). They could not say anything to each other about the work as a whole, or simply talk, without leaving the program.
- **Comments are the nearest thing there was**: notes with who wrote them and when, kept in the project's own document as plain objects, outside undo by an origin of their own, shared, saved and kept in the history with no machinery of their own. A chat can be the same.
- **The document pane** (0064) holds what is about the document of the active side as tabs, one at a time; its tabs carry counts, as the loose citations do.

## Decision

1. **The messages are kept in the project's own document**, an array `chat` of plain objects, each with its id, who wrote it (`author`, an id and a name, as the author of a note of a comment), when (`created`) and what it says (`text`). They reach everyone through the server as every other change does, with no change to the server and none to the protocol; they are there for whoever opens the project the next day; a message written while the server cannot be reached is sent when it can. A version of the program that does not know the chat carries the array untouched.
2. **Outside undo**: written with an origin of its own (`CHAT`), and the array is not in the scope of the undo manager. Ctrl+Z in the text never takes a message back.
3. **The model** (`project/model/changing/chat.ts`): *say* a message (trimmed; nothing for an empty one; at most 4,000 characters, a longer one cut), *unsay* one's own, *resay* what was taken back, *clear* the whole chat. `project.chat` is the list of messages, read again when the array changes and only then, never on a keystroke in the text.
4. **A tab of the document pane, *Chat***, the last of its tabs, there while the project is shared or holds messages; where neither, it is not shown, and a pane kept at the chat shows the references instead.
5. **The panel**: the messages from the oldest to the newest, the newest at the foot; each group of messages with the initials of who wrote them on their colour, their name, and the time of day; a line with the date where the day changes; the words with their line breaks, selectable. Messages of one person within five minutes of each other, on one day, stand under one name. Under them a field of several lines that grows with what is written: **Enter sends, Shift+Enter makes a new line**, and a *Send* button. The panel stays at the foot when a message arrives while it is at the foot; where the reader has gone up, it stays where it is.
6. **One's own message can be deleted**, from its menu; nobody deletes another's. Messages are not changed once sent.
7. **While the project is not shared** but holds messages, the tab shows them without the field, and its head has *Delete the conversation*, asked about before it is done. A conversation so never travels unseen in a project, and can be taken out of it.
8. **Unread messages**: the message read last is kept on this computer with the project's view, beside the mark of the document (0081), by its id and when it was written. The messages of others after it are unread until the chat is shown with the window in front; they are counted on the tab, and a dot on the *Document* button of the bar of each side of the project says that there are some while the pane is closed.
9. **A message that arrives is told**: a message of another that arrives while its project is open and its chat is not shown, or the window is not in front, is told by a toast, `name: the first words`, with *Show*, which gives a side of that project the focus and opens the pane at the chat. Several that arrive within a moment of each other are told by one toast that counts them. Nothing is told of one's own messages, nor of what has been read, nor twice of one message while the window is open.
10. **The palette finds *Chat*** (`side-chat`, with no key of its own), while the tab is there.
11. **Not part of anything written**: the chat is not typeset or exported, not written into the Org copy, not searched, and not carried when elements are copied to another project; none of them read the array. **The history makes no session of a message**: a record of the history all of whose changes are in the chat, or among who deleted what, is left out of the sessions the history panel lists and the review offers to compare with, as an empty record is. The review compares the texts of elements, and so never counts a message as a change.

## Choices made in building this, which the owner has not been asked about

1. **Kept in the project, and for good**, rather than told only to those who are there at the moment, which needs nothing kept, but is of little use to people who seldom work at the same hour.
2. **A tab of the document pane**, rather than a window or a pane of its own.
3. **The toast when a message arrives, and the dot on the Document button.**
4. **Enter sends**, as in the comments; Shift+Enter is the line break everywhere in the program.
5. **A duplicated project, and a project saved as a file, carry the conversation**; the Org copy does not, so a project read back from Org is without it. The mark of what was read is not carried: in a copy every message of another is unread at first.
6. ***Delete the conversation* only while the project is not shared.**
7. **A message deleted can be put back** by *Undo* in the toast that says it was deleted, as a note of a comment can; this is the model's *resay*. It is put where it stood, or at the end where the chat has grown shorter since.
8. **One's own messages are told apart as one's own notes of a comment are**: by the tools that come on hover, here the three dots of the menu, and by nothing else; the menu opens on a right click on the message too. The model itself refuses to take back another's message.
9. **The time of day stands at the head of a group**; the time of each message after the first is in its tooltip, and the date in full in the tooltip of the head's.
10. **Grouped within five minutes, on one day**; the first group of the chat has its date line as well.
11. **The window is in front** until it loses the focus or its page is hidden, and again when it gains the focus or is pressed or written in. A chat shown while the window is behind it is not read, and a message that arrives then is told.
12. **What was there and unread when the project was opened is told** as well, once: a project opened after a time away says that there are new messages, in one toast that counts them.
13. **Records of who deleted what are left out of the sessions** too, in a project with a chat. They are written in a batch after the deleting, so that a message taken back would else make a session of its own; where a text was deleted, the deleting itself is the session, as before. A project without a chat is read exactly as before.
14. **The panel's head keeps the line of the document pane** with the element of the active side, as every tab has it, though the chat is of the whole project.

## Not done

- A comment alone still makes a session in the history panel, of no signs added or removed, as it did before; this record leaves comments as they were.
- The review of changes, while it is open, works its changes out again a moment after a message, as after any change to the project; it finds none in the chat.
- No sound and no notice of the system: only the toast in the window.
- No count of the unread in the list of projects at the left.

## As built, 2026-11-13

- **The model**: `CHAT` in `model/origins.ts`; `ChatMessage` in `model/types.ts`; `model/changing/chat.ts` (`say`, `unsay`, `resay`, `clearChat`, `chatMessageOf`); `Project.yChat` and `Project.chat` in `model/project.svelte.ts`, read in `yChat.observe`.
- **The interface**, in `src/lib/chat/`: `reading.ts` (what is unread, groups, the first words, what is to be told: plain functions); `chat.svelte.ts` (whether a project has a chat, the unread count, whether the chat is shown, what is asked of the window); `ChatPanel.svelte`; `ChatHost.svelte` (the toasts, and the read mark while the chat is shown), mounted once by `ProjectView.svelte`. The tab in `project/SideTabs.svelte` (which can now leave a tab out) and `project/sides.svelte.ts`; the ask from a toast answered by `project/document-pane.svelte.ts`; the dot in `project/SideBar.svelte`; the read mark in `project/layout.ts` (`StoredView.chat`) and `OpenProject.chatRead`, saved by `SideView.svelte` with the rest of the view; the key `side-chat` in `shell/keys.svelte.ts`. The history's sessions in `history/engine.ts` (`Kept.aside`).
- **Words**: `locales/en/chat.ftl`, `locales/nb/chat.ftl` (*Samtale* in Bokmål for the chat and its tab, no word for it being in use), and `keys-side-chat`.
- **Tests**: the model, two copies exchanging messages, undo, the cut, a message of another copy read with care (`model/chat.test.ts`); unread, groups, the first words, what is told (`chat/reading.test.ts`); what the window reads (`chat/chat.svelte.test.ts`); the panel mounted, Enter and Shift+Enter, the menu on one's own, the field and the deleting by whether the project is shared (`chat/ChatPanel.test.ts`); the read mark kept with the view (`project/layout.test.ts`, `project/open-projects.svelte.test.ts`); no session of a message (`history/engine.test.ts`).
- **Counts.** Thirty-six new tests of the interface; all 1480 pass, and svelte-check finds nothing. No change to the core, the shell or the server.
- **The script** `e2e/chat.mjs`, the real server and the program twice, written and not yet run.

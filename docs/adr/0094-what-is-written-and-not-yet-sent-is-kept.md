# 0094 — What is written and not yet sent is kept

Date: 2026-11-14. Status: built on 2026-11-14, its choices not yet confirmed by the owner; from the owner's words of the same day ("When I start writing a comment in the chat of a shared project, and go somewhere else to check something, the comment I had started has vanished when I come back. This happens often, so whatever is typed into the field before submitting it should be saved until it is either cancelled or submitted."). Amends 0092 (the field of the chat) and 0024 (the fields of the comments).

## Context

- **The field of the chat kept what was written in it within its own panel** (0092), and the panel is there only while the document pane shows the chat. Another tab shown, the pane closed, or the project left for the library, the files or the search, and the panel was taken away with the words in it; shown again, it was made anew, empty. One goes to look something up in the middle of writing a message more often than not.
- **The panel of comments (0024) lost what was written in the same way**: an answer under a thread, the words of a comment being begun, and a change to a note of one's own were all the panel's own. Of a comment being begun the window remembered where it was to stand, one for all the projects open, so that the box came back without its words, and came up in another project where that had an element of the same id (its top always has).
- **Two sides may show two projects**, and the document pane follows the side with the focus. A panel that stayed while the focus went from one project to the other kept its words, and would have sent to the one what was written for the other.
- **A project keeps how it was looked at on this computer** (0064): its view, saved with the project's entry a moment after it changes and when the project is let go, and never part of the project itself; the mark of the document (0081) and the message of the chat read last (0092) are kept there.

## Decision

1. **What is written in a field of a project and not yet sent is there until it is sent or given up**: the message being written in the chat; an answer under a thread of comments; a comment that is being begun, with the element it is on and its passage; a note that is being changed.
2. **Whatever is looked at meanwhile**: another tab of the document pane, the pane closed and opened, another side or another project given the focus, the project left for the library, the files, the search or the start, and the application closed and opened again.
3. **It is the project's to keep, with its view on this computer**, beside the message read last: `drafts`, the words by the field they stand in, and `commenting`, the comment being begun (the two positions of its passage written as text). Not in the project's document: nobody a project is shared with sees what was not sent, and neither a duplicate nor a project saved as a file carries it, since they do not carry the view.
4. **Sent, it is kept no more**; nor when it is given up: by *Cancel* where a field has one (a comment being begun, a note being changed), and by emptying the field where it has none (the chat, an answer). A field with no words in it is not kept from one opening to the next.
5. **What has lost its place is kept no more**: an answer whose thread is gone, a change to a note that is gone, a comment being begun on an element that is gone. This is seen to when the view is saved.
6. **A comment being begun belongs to its project**, where it was the window's. It stays until *Comment* or *Cancel*: a thread asked to be shown, as by pressing a mark in the text, no longer takes it away. Another comment asked for while one is being begun takes its place, with the words already written, as before.
7. **A note is being changed while its field is written in**, each note by itself: beginning to change another no longer drops the first change unsaid.
8. **Each field shows what belongs to the project shown**: where the focus goes from one project to another with the panel open, the words of the one are not offered to the other.
9. **The field of the chat is as high as what stands in it** when it comes with words, as when they are written; and its height counts its border, so that no scrollbar stands in a field that shows everything.

## Choices made in building this, which the owner has not been asked about

1. **The fields of the comments as well as that of the chat.** The owner spoke of the chat, and of "whatever is typed into the field before submitting", "cancelled or submitted"; the chat has nothing to cancel with, the comments have, and they lost what was written by the same cause, in the next tab.
2. **Kept when the application is closed**, not only while it runs: a project is let go already when the library is gone to, so that what must hold through that is on disk anyway, and a message begun on Friday is there on Monday.
3. **On this computer alone.** One's other computers do not get it: what is not sent is not sent anywhere.
4. **No *Cancel* in the chat**: emptying the field gives a message up, as in every chat.
5. **No sign that a tab holds something unsent.** The words are found where they were written; nothing on the tab or the Document button says that they are there.
6. **A message begun stays when the project is no longer shared**, though the field is not shown then; it is there again if the project is shared again.
7. **The focus is given when it is asked for**: to the field of a comment when the comment is begun, to that of a note when *Change* is pressed. A panel that comes back with something unsent does not take the focus from where it is.

## Not done

- Other fields of the program are as they were: what is written in a dialog goes with the dialog, and a field for finding or looking up is not something sent.
- What is written is not kept letter by letter against a crash: the view is saved a moment after the last change (a second and a half), when the window loses the focus, and when the project is let go.

## As built, 2026-11-14

- **The keeper**: `project/drafts.svelte.ts` (`Drafts`: the words by the field, a field being written in though it be empty, what is kept of them); `OpenProject.drafts` and `OpenProject.commenting` in `project/open-projects.svelte.ts`; `StoredView.drafts` and `StoredView.commenting`, read with care, in `project/layout.ts`; saved by `SideView.svelte` with the rest of the view.
- **The chat**: `ChatPanel.svelte` takes what is written as `draft`, bound by `ProjectView.svelte` to the field `CHAT_FIELD` (`chat/chat.svelte.ts`) of the project of the active side.
- **The comments**: `comments/unsent.ts` (the names of the fields, whether a field still has its place, a comment being begun as it is kept and read); `CommentsPanel.svelte` takes `drafts` and `beginning`; `commentsUi.composing` is what is asked of the window, and the panel hands it to the project.
- **Words**: none new.
- **Tests**: the keeper (`project/drafts.svelte.test.ts`); the view written and read (`project/layout.test.ts`); the project opened with what was kept, and what is kept of it after (`project/open-projects.svelte.test.ts`); the fields of the comments and a comment being begun (`comments/unsent.test.ts`); both panels mounted, taken away and shown again, with what is sent and what is given up (`chat/ChatPanel.test.ts`, `comments/CommentsPanel.test.ts`, the first tests of that panel mounted).
- **The script** `e2e/drafts.mjs`, the real server and the program run twice on one data directory: a message of two lines begun in the chat is there after another tab, the pane closed, the library gone to, and the application closed and opened, in a field as high as it was; so are an answer, a comment being begun and a note being changed; sent or given up, nothing of them stays.
- **Counts.** All 1534 tests of the interface pass, and svelte-check finds nothing. No change to the core, the shell or the server, and none to the contract.
- **Tried in the running application, 2026-11-14.** The script `drafts` passed, 23 of 23, the field of the chat 33 pixels high empty and 52 with its two lines, before the application was closed and after it was opened; in the first run it showed a scrollbar in a field that held all its words, which is why the height now counts the border. The scripts of the parts touched passed with it: `chat` 23 of 23, `comments` 16 of 16, and `as-left` (the view kept from one opening to the next) 31 of 31.

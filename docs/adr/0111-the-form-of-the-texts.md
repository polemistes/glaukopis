# 0111 — The form of the texts, and who is let into a project

Date: 2026-11-19. Status: built on 2026-11-19, its choices not yet confirmed by the owner. From the plan `docs/plans/a-box-of-rich-text.md`, of which it is the first stage, and the owner's word of the same day that this guard goes out a release ahead of the box ("what you say is best"). Adds to 0006 (sharing through a server).

## Context

- **The editor takes out of a project what it does not know.** The binding of the editor to the project's document (y-prosemirror 1.3.7, `createNodeFromYElement` and `createTextNodesFromYText` in its `sync-plugin.js`) makes the nodes of the editor from what the document holds. Where its schema has no such block, or no such mark, making fails; the binding then deletes what it could not make from the document: the block with everything in it, or the words that carry the mark. The deletion is a change like any other, and goes to everyone who shares the project. Tried in `src/lib/editor/form.test.ts`, with the editor's own schema.
- **So anything new in the texts is lost where two versions meet.** A box of rich text made in a new version would vanish, for all, the moment someone opened the text in the version before. The same holds for whatever was added to the texts between two versions that share a project today.
- **Nothing compared the texts.** A project file says the form it was written in, and an older version refuses it (`projectfile.rs`, `FORMAT`). Those who share compare the protocol of the server (`sharing.rs`, `PROTOCOL`). The texts themselves said nothing of what they may hold.
- **The versions that are out cannot be changed.** Whatever is built now, 0.2.13 and those before it will bind their editors to what they are sent. Only the server stands between them and a project.

## Decision

1. **The texts have a form, a number** (`src/lib/editor/form.ts`, `FORM`). It is 1 now. It is raised by one with each release that lets the texts hold something the version before does not know: a block or a mark that is not in its schema.
2. **A document says its form itself**, a project's and the notebook's alike: in a map of its own, `form`, where the number is a key (`"2"`) and the value says nothing. Where it says none it is of the first form, so every document there is says the right thing already. It is said when the first thing of that form is put into the document, not when a new version opens it: a project in which nothing new was used stays open to everyone.
3. **A key, set once, because that can be read without taking anything in.** Only what is set for the first time names its map and its key in the bytes of the change it travels in. So the form of a change is read from its bytes (`formInUpdate`), before any of it is in the document, where the editor would already have seen it.
4. **A project of a later form is not opened**, nor the notebook: asked of what is on disk before anything is made of it (`state/projects.svelte.ts`, `notebook/open.svelte.ts`). The place of the project says *This project was written by a later version of Glaukopis. Update Glaukopis to open it.*
5. **What the others send of a later form is not taken in** (`sharing/connection.svelte.ts`): the answer of what the server holds, or a change of another's, is looked at first; where it says a later form, nothing of it is taken, the socket is closed and none is opened after it. The project stays open and is written in as before; what is written is kept and brought along when a version that knows the form opens it. The user is told once, in a dialog, and the sharing window says it for as long as it holds.
6. **The application tells the server the form it knows**, in the address of its socket (`&form=1`; `socket_url` in the core, `sharing_ticket`). An address that says none is of a version from before this, and is taken as the first.
7. **The server keeps the form of each project and of each one present** (`crates/server/src/rooms.rs`, `form_of`), read from the project's document as the application says it. **It lets no one in who does not know the project's form**, and **when a change raises the form it lets go those who do not know the new one before the change is passed on**, so that nothing of it reaches them. Both with the closing code 4007. This is what protects the versions that are out: to them the project is one whose server is not within reach; what they write is kept with them, and brought along when they have been updated.
8. **The protocol of the server stays 1.** A new application works with an old server, guarded by 5 alone; an old application works with a new server in every project of the first form.
9. **Raising the form is a change of its own, made first** (`raiseForm`): so that a server lets go those who do not know it before the thing itself is sent. The server does not count on that: one who raised the form and wrote in it while away brings both in one change, and it is for that the server looks before it passes on.

## What this does not do

- **A server from before this lets everyone in.** There, a version from before this one is unguarded, as it is today. Whoever runs a server updates it before a version with a second form is used with it; `docs/server.md` says so.
- **A project file** written from a project of a later form is refused by the versions with this guard when the project made of it is opened, not when the file is read. For the versions that are out to refuse the file itself, it is to be written with a higher number of its own (`projectfile.rs`, `FORMAT`) where the project's texts are of a later form: to be done with the first thing that raises the form, the box.
- **A version from before this one is not told why.** It shows what it shows for a server it cannot reach (seen with 0.2.13). That it was let go, and for which form, is in the server's log.
- **One who joins a project of a later form** with a code is admitted, as before, and then kept out of the room: the project stands in their list as one on its way, and the dialog says why it does not arrive.
- **A second window** is of the same version, and is not asked.

## Choices made in building this, which the owner has not been asked about

1. **The form is said only when something of it is used** (2), not by every version that opens a project.
2. **A project of a later form is refused whole** (4), not opened to be read without being written in: every text shown is an editor bound to the document, and the binding is what deletes.
3. **A shared project found to be of a later form stays open and can be written in** (5), unshared for the while, and not closed at once.
4. **The words** (4, 5): *This project was written by a later version of Glaukopis. Update Glaukopis to open it.*; *The notebook was written by a later version of Glaukopis. Update Glaukopis to open it.*; the dialog *Written in by a later version*: *This project has been written in by a later version of Glaukopis. Update Glaukopis to work on it with the others. What you write is kept here, and brought along then.*
5. **The server lets go, and does not hold back** (7): one who does not know the form is taken out of the room, and is not kept in it with the changes of a later form withheld, since what they would be sent after could build on what they lack.
6. **The badge of a shared project** in the list and the path shows such a project as it shows one whose server is not within reach; only the sharing window and the dialog say why.

## Checked

- `src/lib/editor/form.test.ts`: the form read from documents, from a change alone and from the whole, raised by two at once, not found in a text that speaks of forms or in bytes that are no change; and what the binding does with a block and with a mark it does not know, which is the reason for all of it.
- `src/lib/sharing/connection.test.ts`: nothing of a later form is taken in, sent as what the server holds or as a change; no socket is opened after; what is of the form known is taken in; the closing code 4007.
- `crates/server/src/rooms.rs`: those who do not know a form are let go before it is passed on and sent nothing of it, the one who raised it and those who know it stay, no one is let in after who does not know it, and the form is known of a room read from disk.
- `e2e/later-form.mjs`: in the running application, a project and the notebook that say a later form are not opened, with the words, and nothing is written into the project; a project of the first form is opened.
- `e2e/later-form-shared.mjs`: the real server and the application twice, sharing a project, with the script standing in for a later version that tells the server it knows the second form. It says the second form and puts a block neither application knows into the text, in one change. The server lets both applications go; each is told once in the dialog, and by its sharing window after; neither loses a word or is sent the block, on screen or on disk; what is written after is kept; the block is still on the server, whole, for one who knows the form; and one who says no form is not let in (4007).
- `e2e/sharing.mjs`, as before, with the address of the socket now saying the form.
- **The released 0.2.13, tried on 2026-11-19** with the same script (`GLAUKOPIS_E2E_EARLIER=1`, the application of the package as `GLAUKOPIS_E2E_BINARY`). Against the server of this record, both applications are let go, show the server as not within reach, lose nothing, and what the later version wrote stays on the server, whole: 20 of 20. Against the released server (`GLAUKOPIS_E2E_SERVER`), the control, both stay connected and what the later version wrote is gone from the server, deleted for everyone by the two applications: the fault itself, with what is out today.

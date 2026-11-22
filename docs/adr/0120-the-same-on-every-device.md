# 0120 — The same on every device

Date: 2026-11-22. Status: built on 2026-11-22 from the plan `docs/plans/the-same-on-every-device.md`, which is the specification and says what each part does; its choices beyond the owner's words are not yet confirmed by the owner. Adds to 0006 (the server), builds on 0002 (a project is a document of changes), 0085 (a change passes through the shell to the other windows), 0111 (the form of the texts).

## Context

- **A writer has more than one computer.** The owner asked to work on the same projects on more than one device, and said that it is another thing than sharing: "sharing a project is something else than setting up synchronization between devices".
- **Sharing with oneself does not do it.** It is arranged project by project, so a new project is not on the other computer. Most of what is worked with is in no project: the folders of the list, the library and its files, the notebook, the settings. The second computer is a collaborator and not the owner. The owner's token is on one computer only.
- **The owner settled what is synchronized**: "two synchronized devices hold the same things and settings". Nothing is chosen. "Synchronization is also a kind of backup."
- **Two computers that wrote apart** were the owner's worry: "It sounds risky to me." A project is not one latest version that one computer could write over the other's: it is the changes made to it, and two copies that meet give each other what they lack and are the same after. The server's tests and `e2e/sharing.mjs` have shown that since the first server. What is risky is not that work is written over, but that a change lands where it is not seen: the same sentence rewritten on both stands twice, and what was written in a paragraph that the other deleted is gone with it.
- **Every change to an open project already passes through the shell** on its way to disk and to the other windows (0085). So one thread there can send every change to a server and hand what comes back to the windows, whether a project is open or not, without a connection of its own in each window.

## Decision

1. **Synchronization is a thing of its own**, turned on once for a computer in the settings. A writer's computers share a **home** on a server: the computers that may enter, the documents it keeps, one store of files.
2. **The same things and settings on every computer.** No choice of parts or of projects. What stays is what belongs to the computer: its screen, its installed programs, and where things were left (the plan lists it).
3. **A computer is added with a code** made on a computer that is in, good once and for an hour. Each computer has a token of its own, kept as a hash on the server; any computer removes any other. The last to leave takes the home off the server.
4. **One call brings one document to be the same**, the exchange: the computer says what it last saw and sends what it has made since; the server answers with what it had beyond that, and with whether the two wrote apart. The computer works out what it sends from the bytes on disk and adds what it receives to the log: it reads no document into memory.
5. **The engine is in the core**, one thread, one request at a time. What changes here is sent a few seconds after it is written; what changed elsewhere is asked for every half minute. What it receives for an open project is handed to the windows as a change of another window is.
6. **What is written apart is brought together by itself.** When both had something the other lacked, the project as it stood here is kept as a version, the moment before is kept with the project, the writer is told, and *Show the changes* opens the review of the project from that moment.
7. **What is not a document is made one for the journey**: the folders, the favourites, the folder of each project, what the list shows of it, how it is shared, the settings, and later the library, are maps of a document of the home, field by field. Each store is brought to be the same as its map three ways, with what both agreed on last, so that a change here and a change there are told apart. Where the same field changed on both, one wins.
8. **Deleted on one computer and written in on the other, a project is kept.** A deletion is written with the digest of the document the deleter saw; a computer that holds more than that takes the deletion back. Otherwise the project goes to its trash.
9. **At the first meeting everything of both is kept**, and where both hold a value for the same thing, the home's stands.
10. **The person follows the writer**: the id by which the history of a project knows who wrote is one of the settings that follow, so that the writer is one person on every computer.
11. **The form of the texts is guarded as in a room** (0111): a computer that does not know the form of a project is not sent it and is not let write into it.
12. **`yrs` becomes part of the application**, for working with changes as bytes and for the documents the core makes itself.
13. **The library is a document of its own in the home**, of maps as the home document is: a reference is many names, its id and the field, so that a title corrected on one computer and a year corrected on another are both in it after; so are a collection and the record of a file. **The files follow their records**: one that a record names and the home lacks is sent, one lacking here is fetched, one that no record names is taken off the server; all streamed, never whole in memory. A reference, a collection or a file changed on one computer while it was deleted on another is kept, as a project is.
14. **What the application writes into a project by itself is no writing.** With the history of a project on, a window that opens it writes who is who into it. A window says with each change whether the writer wrote any of it, and two computers wrote apart only where the writer wrote on both. Found by the script that tries the synchronization in two running applications.

## What this does not do

- **The server can read everything**, as it can read what is shared. Encryption on the computers fits here, since the key need never leave them; it is left for later.
- **The key of a shared project is kept in the home**, so that every computer of the writer is the same collaborator. Whoever runs the server that synchronizes can read it.
- **The server keeps no history.** Every computer keeps earlier versions of what it holds, and a version from before another computer's changes come in.
- **Changes are not seen as they are typed** on the writer's other computer, and it shows no cursor.
- ***Show the changes* needs the history of the project to be on**: the review compares with a moment, and only a project whose history is kept can be shown as it was then. Where it is off, the writer is offered the earlier versions, among which the project as it stood before is kept.
- **A file larger than the server takes** stays on the computer that has it, which says so; the others know of the file and show it as missing.
- **A deletion or a mistake is synchronized as faithfully as anything.** What covers a mistake is the trash and the earlier versions, on every computer.

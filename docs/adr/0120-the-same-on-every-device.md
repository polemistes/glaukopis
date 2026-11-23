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

## Addendum, 2026-11-23: a device, not a computer

A phone is one of the writer's devices since stage 2 of the app for Android (record 0123), and takes the notes alone (record 0122). So the words of the synchronization say *device* (Bokmål *enhet*) wherever a phone may be meant, on the computers too: the list of the home, *Add a device…*, *Name of this device*, *Stop synchronizing on this device*, the toast of what was written apart. The owner chose the word on 2026-11-22. The names of the messages and the hooks of the scripts stay as they were; the other seven languages follow in their round. `sync_computer` is `sync_device`, and on Android it offers the phone's model. The sentence under *Synchronization* stays as it was on a computer, and a phone has a sentence of its own, since it holds the notebook and the references alone.

## Addendum, 2026-11-23: where the form has changed, the synchronization stops; a full home; the order of the files

Three mends, built together from items 7, 8 and 10 of *After stage 2* in the plan `docs/plans/an-app-for-android.md`. The choices beyond the owner's words are listed there under *Chosen here, to be told* (14 to 27) and are not yet confirmed by the owner.

### The form

The owner's rule: "If the format has changed, the synchronization stops. The older device (it could also be the desktop program that is out of date, you know), gets the message: 'Update is needed for syncronization.'" It takes the place of decision 11 where that let a computer go on with what it could, and of what record 0122 said of a phone that went on with the references.

1. **A device that meets any document of its home in a later form than its version knows stops as a whole**: the home document, the library's document, the notebook, a project. Its round ends there and it makes no other. Nothing more is sent, fetched or taken off the server, and nothing on the device is touched: what is written there stays, and is brought along after the update. A computer and a phone alike. A phone meets no project, since it exchanges none.
2. **It says so as a state of its own**, `outdated`, with the owner's sentence as what is wrong. The settings say *Synchronization has stopped on this device* over it and offer no round; the line over a phone's notes says the sentence.
3. **It stays stopped until the application is updated.** The device keeps what its version knew when it stopped (`sync/outdated.json`: the version, and the forms of the texts, the home document and the library's document). A version that knows the same is stopped from its start and asks the server nothing; one that knows anything else makes a round, and stops again where it still meets a later form. What is kept goes with the home when the device leaves it.
4. **What the round exchanged before it met the later form stands.** Each was a document in a form the version knows, brought to be the same by an exchange that is whole in itself, as when the network goes in the middle of a round. The server tells no form in its list of documents, so a device cannot know before it asks.
5. **Nothing is written into a document of a later form.** A project and the notebook are guarded by the server, which sends nothing of one in a later form and takes nothing into it (0111). The home document and the library's say their form within themselves, where the server does not read it; so such a document is asked for, with nothing sent, each time before anything is sent into it, and where what comes is of a later form, nothing of it is kept on the disk. One gap is left: what another device writes between the asking and the sending is seen only by the answer to the sending. The form of each such document as it is kept on the device is looked at too, before a round reads anything from it, so that an application put back to an earlier version stops as well (after the second reading). What the document holds beyond the server's is sent at every exchange that sends, as before, and not only where it is marked as unsent.
6. **A stopped device sweeps no file**: it is kept as one whose notebook was refused (0123), since it lacks the notes others write from then on.
7. **Leaving still works**, and the devices of the home can still be listed, renamed and taken out.

### A full home

Found on the owner's computer: a library of some 25 GB and a home that holds 10. The server refused each file that did not fit before all of it had come and closed the connection; the proxy in front answered 502; the engine took that for a server not reached and ended the round, at every round, before anything else of the files was done. So the pictures of the notes never reached the server, and the phone showed notes without them.

8. **A file that does not fit is not sent.** Before a file is sent, the home is asked what it holds and may hold. What does not fit is passed over, and the round says that the server is full and how many files wait, as one of its problems and with the server reached: *The server is full. N files are not on your other devices.*
9. **It is said for as long as it is so**, at every round, and such a round is not one in which everything is the same. A file too large is said once in a run (as before); said so, a full home stood in the settings for half a minute and was then taken for mended.
10. **What waits is offered again** when the files are next looked at: when the library changes, at *Synchronize now*, when a phone's app comes to the front, at the next start.
11. **Room is kept for the files of the notes** (after the second reading of the diff): of what a home may hold, a tenth and no more than a gibibyte is theirs alone, and the other files stop that far short of the limit. The order below holds for one round; without this, a library larger than its home filled the home in the first, and no picture put into a note afterwards found room. What the notes' files hold on the server already comes out of what is kept. Files of the notes that wait all the same are said apart and first: *The server is full. N files of your notes are not on your other devices.* Nothing is taken off the server to make the room: a home filled before this needs its limit raised.
12. **A refusal for want of room that does arrive is known for one**: the server says it as it says a file too large (413 `too-large`) with words of its own, which the engine reads; `full` and 507 are taken so too. What a proxy answers of its own (502, 503, 504) stays the network's.

### The order of the files, and one file that fails

13. **What no record names is taken off the server first**, since it makes room.
14. **Then the files go in one order, whether sent or fetched: those the notes hold before the library's, and the smaller before the larger.** A picture of a note is never behind a scan of hundreds of megabytes, either way, and where not everything fits, the large files of the library are what waits.
15. **A file that fails as the network fails is told from a server that is not reached** by asking the home at once how it stands. Where that fails too, the round ends, as before. Where it is answered, the failure is that file's: it is said, and nothing as large goes the same way in this round, since each try may send much before it fails. What goes the other way goes on: a file that cannot be sent does not hold back what is to be fetched. The file then waits before it is tried again, one look at the files, then two, then four, to sixty-four at the most, said the while, so that the files as large go in the rounds between; and a phone that is not in front asks nothing at regular times for it (both after the second reading).
16. **A round that does not reach the server is written in the log** when its reason is another than the round before, and once when the server is reached again. Before, it was never written, and the log could not say whether rounds had failed.

### What holds it

- `crates/server/tests/phone.rs`, with the engine as this version and as a later one (`Sync::of_version`): a phone older than the form of the notebook; a computer and a project; the library's document; the home document, on a computer and a phone; a stopped device that leaves and joins again. Each stops, sends and fetches nothing more, says the sentence without asking the server, and goes on when started as the later version.
- `crates/server/tests/full_home.rs`: a home too full for the library's files still takes the pictures of the notes, which reach a phone, and a picture taken on the phone reaches the computer; the full server is said at every round; room that is made is used, the smaller file first; a file a proxy cuts off with 502 is said of the file while what is to be fetched arrives; a network that is away at that moment ends the round as a server not reached; the server's refusal for want of room is told from a file too large.
- Beside the code: the order of the files, the reading of a refusal, the log of a server not reached, a stopped device from its start.

### What this does not do

- The server does not tell the form of a document in its list, and does not read the form of a document of maps: see 4 and 5.
- A file that takes more than twenty minutes to send is never sent: the network's client gives up then, as before.
- The settings do not show how much of the home is used.

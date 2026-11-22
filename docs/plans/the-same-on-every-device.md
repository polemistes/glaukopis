# The same on every device — the build plan

From the owner's words of 2026-11-22 (the last section of `docs/brief.md`: read it first). The record is `docs/adr/0119-the-same-on-every-device.md`. This plan is the specification the parts are built from: where it says a path, a name or a shape, that is what is built.

## What it is

A writer's computers hold the same things and settings. It is turned on once for a computer, in the settings, not for each project; from then on everything the writer makes on one computer is on the others, through a server. It is not sharing: nobody else is let in, and nothing is arranged project by project. It is also a kind of backup: the server and every computer hold everything.

## Decided by the owner

1. **A thing of its own**, not sharing a project with oneself.
2. **Two synchronized devices hold the same things and settings.** No choice of parts, none of projects.
3. **It is also a kind of backup.**
4. **What is written apart is brought together by itself.** The writer is not asked to keep two copies under two names and compare them. Accepted as proposed: the program knows when two computers wrote apart, keeps a version from before, and shows what the other brought.
5. Accepted as proposed, with "Ok! Make it!": **deleted on one computer and written in on the other, the project is kept**; **settings and the library are merged setting by setting and reference by reference**, and where the same field was changed on both, one wins; **two computers that both hold things when they first meet keep everything of both**.

## The assistant's, not confirmed

To be told of again when it is built, with the other choices that await the owner.

1. **The words**: *Synchronization* (Bokmål *Synkronisering*); a device is a *computer* (*datamaskin*), as in "kept on this computer" elsewhere in the program.
2. **A computer is added with a code** made on one that is in: good once, for an hour. Each computer has a key of its own, so a lost one can be removed from any of the others. All computers are equals.
3. **The last computer to leave takes everything off the server.**
4. **What stays on each computer**: what belongs to its screen and its installed programs, and where things were left (the list is in *What follows and what stays*).
5. **At the first meeting, where both hold a value for the same thing, the one already kept on the server stands.** The computer that joins adds what the others lack.
6. **A project deleted on one computer goes to the trash of the others.** Removing it from the trash for good is done on each computer; the server's copy goes with the first that does.
7. **The key of a shared project follows its project**, so that every computer of the writer is the same collaborator in it. The server that synchronizes can read that key, as it can read everything else.
8. **Changes reach the other computers within half a minute**, not as they are typed, and no cursor of the other computer is shown: one writer is at one computer.
9. **A version is kept before another computer's changes come into a project**, at most every ten minutes, and always when the two wrote apart.
10. **The Yjs library for Rust (`yrs`) becomes part of the application.** It was part of the server only.
11. **Not built in this round**: encryption on the computers, so that the server cannot read; a history kept on the server; a choice of what is synchronized.

## What stands in the code today

Read on 2026-11-22.

- **A project on disk** (`crates/core/src/projects.rs`): `state.bin` (the document as one update), `updates.log` (changes since, each a record that says whether it was made here and when, `history.rs`), `history/` (earlier states), `project.json`. The interface owns the document; the core keeps it as bytes.
- **Every change to an open project passes through the shell** on its way to the log (`project_append` in `src-tauri/src/commands/projects.rs`), which passes it to the other windows as the event `project-update`; a window applies it with the origin `WINDOW`, saved by the one who sent it and not undone (record 0085). The notebook has the same (`notebook_append`, `notebook-update`).
- **The notebook** is one document kept as a project's is (`crates/core/src/notebook.rs`), its top-level maps keyed by id.
- **What is not a document**: the folders and favourites (`projects/folders.json`), the folder a project is in and what the list shows of it (`project.json`), the settings (`settings.json`, written key by key), the library (a BibLaTeX file, collections, the record of the files), the files themselves (a store by SHA-256), styles, formats, templates.
- **The server** (`crates/server`): rooms, each a Yjs document kept by `yrs`, admitted by tokens; files of a room by their SHA-256; `docs/server.md`.
- **The person** who writes is an id in the settings (`person`): the history and the review of a project know the writer by it.
- **The review of changes** (`src/lib/review/`) reviews from a moment, a Yjs snapshot, which may be a chosen one.
- **yrs** can merge changes, tell what one holds that another lacks, and read a state vector and the deletions, all from bytes without making a document (`merge_updates_v1`, `diff_updates_v1`, `Update::state_vector`, `Update::delete_set`).

## The shape

### A home on the server

A writer's computers share a **home** on a server: the computers that may enter it, the documents it keeps, and one store of files. A home is made by the first computer (which needs the server's password where the server asks one, as publishing does), and gives that computer a token. A computer that is in can make a **code**; presenting the code admits another computer and gives it a token of its own.

A home keeps documents by kind and id:

| Kind | Id | What |
| --- | --- | --- |
| `project` | the project's id | the project's document, as it is |
| `notebook` | `the` | the notebook's document, as it is |
| `home` | `the` | what is not a document on disk, as a document of maps: see *The home document* |
| `library` | `the` | the references, the collections and the record of the files, as a document of maps |

### One exchange

Everything is brought to be the same by one call, the **exchange** of one document: the computer says what it last saw of the server's document (`seen`, a digest), what it had then (`since`, a state vector), and sends the changes it has made since. The server answers with what it had beyond `since` before these changes came (the **news**), with the digest and the state vector of the document as it stands now, and with **whether the two wrote apart**: both had something the other lacked, and what the server had came from another computer.

The computer needs no document in memory for it. What it sends is worked out from the bytes on disk; what it receives is added to the log as a change that came from elsewhere, and passed to the windows as a change of another window is.

### The engine

One thread of the application, in the core (`crates/core/src/sync/`), run by the shell:

- **what changed here** is sent a few seconds after it was written (the shell tells the engine of every change it writes; the engine also looks at what is on disk, so a project changed by any other way, an import, a copy, a restore, is seen too);
- **what changed elsewhere** is asked for every half minute, by one small call that says whether anything in the home changed since it was last asked;
- everything is one request at a time.

### Written apart

When an exchange of a project says the two wrote apart:

1. the project as it stood here before the news is kept as a version in its `history/`;
2. the moment before the news, a Yjs snapshot, is kept with the project;
3. the news is taken in;
4. the writer is told, once for each project, with **Show the changes**: the review of the project from that moment.

### Deleted

A project deleted on one computer is written into the home document as gone, with the digest of its document as that computer last saw it. Another computer moves the project to its trash, unless it holds changes the deleter did not see (it has something not yet sent, or the server's document is no longer the one the deleter saw): then the project is kept, and the word that it is gone is taken back. A project brought back from the trash takes the word back too.

### The first meeting

A computer that joins a home brings what it holds: its projects, its notes, its references and files join those of the home. Where both hold a value for the same thing (a setting, the folder of a project both have), the home's stands.

### What follows and what stays

Everything follows, except what belongs to the computer:

- of a project: where it was left (`view`), the tabs of the files beside it (`sources`);
- of the settings: `window`, `arrangement`, `projectsPaneWidth`, `librarySideWidth`, `libraryDetailWidth`, `lastPlace`, `recentProjects`, `projectsList`, `interfaceSize`, `textSize`, `editorFont`, `pandocPath`, `tesseractPath`, `ocrLanguages`, `notebookView`, `notebookListWidth`, `filesView`, `versionTold`, `recentEmojis`;
- the full history of a project (`changes.log`) and its earlier versions (`history/`): each computer keeps its own;
- the trash; the readable Org copies; the languages of spelling and OCR, which each computer installs.

The settings that follow are listed by name in the core (`sync/settings.rs`); a test of the interface fails when a setting is in neither list, so that whoever adds one decides.

## The server

Built in `crates/server`. Nothing of the rooms changes for those who share.

### On disk

```
homes/<home>/home.json                     the computers and the codes: hashes only
homes/<home>/docs/<kind>/<id>/state.bin    a document, kept as a room's is (state.bak, state.damaged)
homes/<home>/docs/<kind>/<id>/said.json    what is said of it without reading it
homes/<home>/files/<sha-256>               the files
```

`<home>` is a UUID the server makes. `<kind>` is one to sixteen small letters; `<id>` is as a room's id (`valid_room_id`).

`home.json`: `{ "id", "created", "devices": [{ "id", "name", "token" (its hash), "joined", "last_seen" }], "codes": [{ "id", "hash", "created", "expires" }] }`. At most 16 computers; at most 5 codes that are open; a code is as an invitation's (`secrets::code`), good once and for one hour. A name is cleaned as a member's is, to 100 characters.

`said.json`: `{ "digest", "bytes", "changes": [{ "digest", "device" }] }`: the digest of the document, how much its state holds, and the last 32 changes, each by the digest after it and the computer that brought it. Written when the state is written.

### The digest of a document

The SHA-256, in hex, of what the document holds, said the same on every run: for each client in the order of its number, the number, its clock, and the ranges it deleted, in order and joined where they touch. Made from `txn.snapshot()`. Two documents with the same digest hold the same. It is kept with the room while the room is in memory, and made anew when the document changes.

### Calls

The token of a computer is sent as a room's is (`Authorization: Bearer`). Refusals are told as the others are (`Failure`: `error`, `message`), each sentence a refusal of its own with the client's words for it (`glaukopis_core::sharing::refusal_in_words`, and the test that asks for them).

| Call | Does |
| --- | --- |
| `GET /api/info` | as before, and `"homes": true` |
| `POST /api/homes` `{ name, password? }` | makes a home: `201 { home, device, token }`. Password and counting as publishing; `--max-homes` (`GLAUKOPIS_SERVER_MAX_HOMES`) the most homes |
| `POST /api/homes/join` `{ code, name }` | admits a computer: `{ home, device, token }`. Counted as joining is |
| `GET /api/homes/{home}` | `{ home, created, you, devices: [{ id, name, joined, lastSeen, you }], codes: [{ id, created, expires }], usedBytes, maxFileBytes, maxHomeBytes }` |
| `POST /api/homes/{home}/codes` | `201 { id, code, expires }`: the code is told this once |
| `DELETE /api/homes/{home}/codes/{id}` | `204` |
| `PATCH /api/homes/{home}/devices/{device}` `{ name }` | renames a computer; answers as `GET` of the home |
| `DELETE /api/homes/{home}/devices/{device}` | `204`. Any computer removes any, itself too. With the last, the home goes, and all it kept |
| `GET /api/homes/{home}/docs?seen=<stamp>` | `{ stamp, same: true }` where nothing changed since `stamp`; else `{ stamp, docs: [{ kind, id, digest, bytes }] }`. The stamp is the SHA-256 of the kinds, ids and digests in order |
| `POST /api/homes/{home}/docs/{kind}/{id}?form=<n>` | the exchange, below |
| `DELETE /api/homes/{home}/docs/{kind}/{id}` | `204`: the document is taken off the server |
| `GET /api/homes/{home}/files` | `{ files: [{ hash, size }], maxFileBytes }` |
| `GET`, `PUT`, `DELETE /api/homes/{home}/files/{hash}` | a file, sent and fetched as a room's is; `DELETE` gives `204` |

Every call but the first three asks for the token of a computer of the home, and notes that the computer was seen (`last_seen`, written at most once a minute).

The files of a home may hold `--max-home-mb` megabytes together (`GLAUKOPIS_SERVER_MAX_HOME_MB`, 10240 where nothing is said) and one of them `--max-home-file-mb` (`GLAUKOPIS_SERVER_MAX_HOME_FILE_MB`, 512). A home may keep ten thousand documents. A document of a home may hold what a project's may (`--max-project-mb`).

### The exchange

Sent and answered as bytes (`application/octet-stream`); numbers are 32 bits, little-endian.

- **Sent**: the length of a head; the head, JSON `{ "seen": <digest or null>, "since": <a state vector in hex, or null>, "quiet": <true where the writer wrote nothing of what is brought> }`; the number of changes; each change, its length before it. The head may hold 64 KiB; all of it what a document may, and a megabyte.
- **Answered**: the length of a head; the head, JSON `{ "digest", "now", "news", "apart" }`; then the news, to the end.

Under the room's lock, aside as a room's work is done:

1. `before` is the digest. A document that is not on the server is an empty one.
2. `had` is whether `seen` is not `before`. The news is then the state as one update beyond `since` (all of it where there is no `since`); else nothing.
3. Each change is taken in, as a room takes one in: counted against what a document may hold, refused whole where it cannot be read. The form of the texts is guarded as a room guards it: a computer that says a form (`?form=`) below the document's is refused with `409`, `later`, before anything is taken or sent.
4. `after` is the digest. Where it is not `before`, the document has changed: it is written as a room's is, the change is put in `said.json` with the computer that brought it, and the home's stamp is another.
5. `apart` is: `after` is not `before`; and what was brought is not `quiet`; and `had`; and what the server had came from another computer and was not quiet either. That is: with a `seen`, some change after the one whose digest is `seen` was brought by another computer, or `seen` is not among the changes kept; without a `seen`, the document held something.
6. The answer says `digest` (`after`), `now` (the state vector, in hex), `news` (`had`), `apart`.

A change is **quiet** where the application wrote it by itself: with the history of a project on, a window that opens the project writes who is who into it. Bytes do not say which is which, so a window says it with each change it writes to the log, a project the writer wrote in is marked (`sync.wrote` in its folder), and the engine tells the server. Two computers wrote apart where the writer wrote on both. (Found by the script, which was told of writing apart on the computer that had only opened the project.)

A document that is not there is made by the first exchange that brings a change. One that is asked for and brings none makes nothing. A room of a home is kept in memory as a room is, a minute after it was last used.

### Tests

In `crates/server/tests/homes.rs`, over HTTP, as `tests/server.rs` tries the rooms: a home made, joined, renamed and left; the code good once and counted; a removed computer refused; the last computer taking the home with it; the exchange (what one brings reaches the other; nothing new, no news; written apart told, and one's own change whose answer was lost not told as apart; a later form refused; too large refused); the list and its stamp; a document deleted; files sent, listed, fetched, removed, and their limits.

## The core

`crates/core/src/sync/`, with `yrs` (the version the server has).

| File | What |
| --- | --- |
| `mod.rs` | what synchronization is; `Sync`, the engine; `Status` |
| `kept.rs` | what this computer keeps of it: `sync/sync.json` (`server`, `home`, `device`, `name`), `sync/sync.key` (the token, readable by the user alone), and for each document what was last seen of the server's (`seen`, `since`, and what the files held then) |
| `remote.rs` | the calls to the server, over the one network client |
| `whole.rs` | a document from its bytes on disk: the log first and then the state, so that a state saved meanwhile loses nothing; merged; what it holds beyond a state vector; the moment it is at |
| `home.rs` | the home document, kept in `sync/home.bin`, and its maps |
| `mirror.rs` | what is not a document brought to be the same as a map of the home document: three ways, with what both agreed on last |
| `arrangement.rs`, `facts.rs`, `settings.rs` | the mirrors: folders, favourites and the folder of each project; what the list shows of a project, and how it is shared; the settings that follow |
| `engine.rs` | a round: the home document, the projects, the notebook, the files |

### What is kept of a document here

`projects/<id>/sync.json` (and `notebook/sync.json`, and `sync/home/sync.json` for the home document): `{ "home", "doc", "seen", "since", "lies" }`, where `lies` is how the state and the log lay (how much each held and when it was written). It lies with the document, so that a project that goes to the trash and comes back says the right thing of itself. One made for another home, or for another document, says nothing. Beside it `sync.had`: the moment the document here was at then. A document that no longer holds that moment has lost something on its way to the disk (a window saved a state that lacked what had just come into the log), and all of the server's is asked for again; a server that proves to hold less than was last seen of it is sent everything again.

A document needs an exchange when its files are not what they were at the last, or when the server's digest is not `seen`.

### A round

1. The home document: what changed here is written into it; exchanged; what changed elsewhere is written to disk.
2. The list of the home's documents (`?seen=`), unless nothing changed there and nothing here.
3. Each project: on the server and not here, and not gone: fetched whole, and made (`create_with_id`, the state written with it, so that it is never here empty). Here and not on the server: sent. Both: exchanged where it needs it. Gone: see *Deleted*.
4. The notebook.
5. The files: those the projects and the notes use, sent where the server lacks them and fetched where they are lacking here.

Whatever fails is said in the status and tried again; a round goes on with the next document.

### The home document

A Yjs document of maps whose values are strings (JSON). It is made by the core, one client for each run of the application.

| Map | Key | Value |
| --- | --- | --- |
| `meta` | `form` | `"1"`: a version that does not know the form of a home does not write into it |
| `folders` | `<folder>/name`, `<folder>/parent`, `<folder>/order` | a folder of projects, field by field |
| `places` | `<project>` | the folder the project is in, or `""` |
| `favourites` | `<project>` | where it stands among the favourites |
| `facts` | `<project>` | what the list shows of it: name, description, maps, words, references, pictures, cited |
| `shared` | `<project>` | how it is shared, with the key |
| `gone` | `<project>` | deleted: when, and the digest the deleter last saw |
| `settings` | the setting's name | its value |

### The mirror

For each store that is not a document: what it holds, flat, as names and values; what both agreed on when they last met (`sync/base/<name>.json`); and the map of the home document.

1. What the store holds now and did not when they last agreed is written into the map.
2. The home document is exchanged.
3. Where the map says another value than the store, and the store has not changed since step 1, the map's is written to the store.
4. What they agree on is kept.

At the first meeting with a home that holds something, what the map has stands, and the store adds only the names the map lacks.

### The library's document

A document of the kind the home document is, kept beside it in `sync/library.bin` and exchanged by the same steps (`sync/library.rs`): a library may hold thousands of references, and is not put into the home document. Its stores are mirrors as the others are, written in this order: the folders of the files, the record of the files, the references, the collections.

| Map | Key | Value |
| --- | --- | --- |
| `meta` | `form` | `"1"` |
| `file-folders` | `<folder>/name`, `<folder>/parent`, `<folder>/order` | a folder of the files, field by field |
| `files` | `<hash>/added` | the record of a file of the store: when it was taken in |
| | `<hash>/name`, `/folder`, `/origin`, `/width`, `/height`, `/alt`, `/from`, `/notebook` | the rest of the record, field by field |
| | `<hash>/mark/<id>` | a bookmark in the file: `{page, at, name}` |
| `references` | `<id>/=added` | a reference: when it was added |
| | `<id>/=type`, `/=key`, `/=modified`, `/=merged`, `/=zotero` | the entry's own parts |
| | `<id>/<field>` | each field of the entry but `file` (a field's name holds no `=`) |
| | `<id>/=file/<hash>` | a file of the store it has, by its place among them |
| `collections` | `<collection>/created` | a collection: when it was made |
| | `<collection>/name`, `/parent` | |
| | `<collection>/in/<entry>` | an entry in it, by its place among them |
| `stored` | `<hash>` | that the home holds the file, and its size |

A reference, a collection and a record are each there by a name that never changes once it is made (`=added`, `created`, `added`). Deleted on one computer while another changed it, what the other wrote stands without that name, and every computer that holds the thing, in its store or in what it last agreed, puts back what the map lacks; deleted here after it was changed elsewhere, it is taken back. It is kept, then, on every computer, as a project is. A folder of the files is there by its name, as a folder of projects is.

What lies only on this disk stays: where a file lies in the store (the record's path, and the paths of the `file` field, which follows as hashes); a path in that field outside the store; what `library.bib` holds besides its entries; the small pictures of the files. Two entries with one key: the one whose id comes first keeps it, the other is given one made from it, and that is written into the map at the next round, so that every computer comes to give the same. Where the library found one of its files amiss when it read it (set aside, read in part, a store with files the record did not know), that store meets its map as for the first time. An entry held in text of `library.bib` that could not be read is neither written nor taken out. A file whose record was taken out elsewhere and that the notes here hold stays, held by the notebook alone, and its record is told again.

The library's round reads nothing where its three files lie as they did when it was last brought to be the same (how much each holds and when it was written, kept in `sync/library-lies.json`) and the server's document is the one last seen. The library counts how often it writes its files, so that what the round wrote itself is told from what was written meanwhile. A library that holds nothing, of a home that has none, is sent to no one.

### The files

The files of the store follow their records (`sync/files.rs`): every file of the store has one, the library's, the images of the projects, the files the notes hold. After the records, by those of the library's document: a file a record names that is here and that `stored` does not name is sent, and `stored` says so; one a record names that `stored` names and that is not here is fetched; one `stored` names that no record names is taken off the server. A file is sent from the disk and fetched to the disk a piece at a time, never held whole; what is fetched is written beside where it is to stand, under a name the store takes for a copy being made, and becomes the file of the store when it is whole and holds what its name says (`Library::keep_arrived`). A file larger than the server takes is not sent, and is said once in a run; a file the server says it has not is taken out of `stored`, so that whoever has it sends it again. The files are looked at only at the first round of a run, after the library's document changed in the round, or where something was left to try again: a round in which nothing changed asks nothing of the server beyond the list.

## The shell and the interface

### Commands (`src-tauri/src/commands/sync.rs`, `src/lib/api/sync.ts`)

| Command | Does |
| --- | --- |
| `sync_status()` | `SyncStatus` |
| `sync_start(server, name, password?)` | makes a home; `SyncStatus` |
| `sync_join(server, code, name)` | joins one; `SyncStatus` |
| `sync_home()` | `SyncHome`: the computers and the codes, asked of the server |
| `sync_code()` | `SyncCode { code, expires }` |
| `sync_rename(device, name)`, `sync_remove(device)` | a computer renamed, removed; `SyncHome` |
| `sync_stop()` | this computer leaves; what it holds stays; `SyncStatus` |
| `sync_now()` | a round at once |

```ts
export interface SyncStatus {
  /** Whether this computer is synchronized. */
  on: boolean;
  server: string | null;
  /** What this computer is called among the others. */
  name: string | null;
  /** 'idle' between rounds, 'working' in one, 'offline' where the server is not reached, 'refused' where it lets this computer in no more. */
  state: 'off' | 'idle' | 'working' | 'offline' | 'refused';
  /** When everything was last the same, as RFC 3339; null before the first time. */
  last: string | null;
  /** What is wrong, in words; null where nothing is. */
  problem: string | null;
}
export interface SyncDevice { id: string; name: string; joined: number; lastSeen: number; you: boolean }
export interface SyncHome { devices: SyncDevice[]; codes: { id: string; created: number; expires: number }[]; usedBytes: number }
export interface SyncCode { code: string; expires: number }
```

Events: `sync`, with a `SyncStatus`, to every window when the status changes. `project-apart`, `{ id, name }`, when a project was written in on two computers apart. What was kept of it is asked with `project_apart(id)`: `{ time, moment (base64), kept (the entry of the history) } | null`, and forgotten with `project_apart_seen(id)`.

### The interface (`src/lib/sync/`, the settings window)

A section **Synchronization** in the settings.

- **Not on.** *Server* (as the server of sharing is typed), *Name of this computer*, and a choice of two: *Start here* (with *Password* where the server asks one), or *Join with a code* (with *Code*).
- **On.** The server; when everything was last the same, or what is wrong; *Synchronize now*. The computers, each with its name, when it was last seen, *Rename* and *Remove*; *Add a computer…*, which shows a code and that it is good for an hour; *Stop synchronizing on this computer*, asked once more, saying that what is here stays, and, where it is the last, that nothing is left on the server.
- **Written apart.** A toast, *“Name” was written in on two computers while they were apart*, with *Show the changes*: the project opened, its review from the moment kept.

Words in `locales/*/sync.ftl` and `locales/*/core-sync.ftl`, English and Bokmål together.

## The stages

Each is committed when it is checked: the tests of the part, clippy, and the script that tries it in the running application.

1. **The server**: homes, computers and codes, the exchange, the list, the files; `docs/server.md`.
2. **Projects**: the core's engine for projects, the folders, the favourites, what the list shows, deleted projects, shared projects; the commands; the section in the settings; `e2e/synchronization.mjs`: two applications and a server; a project made on one is on the other; what is written on one while the other is closed is there when it opens; a project open on both follows; a project deleted goes to the other's trash.
3. **Written apart**: the version kept, the moment, the toast and the review; the script takes the server away, writes on both, and brings it back.
4. **The notebook, the pictures and the settings**: the notebook's document; the files that projects and notes use; the settings that follow, the person among them.
5. **The library**: the references, the collections, the record of the files, as the document `library`; all the files of the store.
6. **Styles, formats, templates, and the writer's own words.**
7. **The guide**, and the map in `CLAUDE.md`.

## Left for later

- **Encryption on the computers**, so that the server keeps what it cannot read. It fits here better than in sharing: the key never leaves the writer's computers.
- **A history on the server.** Each computer keeps earlier versions of everything; the server keeps the latest, and the copy from when a document was last opened.
- **A choice of what is synchronized**, should anyone want one. The parts stand alone (a project carries its references and names its pictures; a note goes into a text as a copy), so a choice can be added without rework.
- **Changes as they are typed**, between two computers of one writer that are on at once.

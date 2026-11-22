# An app for Android — the build plan

From the owner's words of 2026-11-22 (the last section of `docs/brief.md`: read it first, and the section of 2026-11-15 on the notebook, where the phone was left out). **Stage 0, the trial, was done on 2026-11-22** (record 0121, which says what was found): Glaukopis is built for Android and runs there as the window of a note, and this plan is corrected by it where it says so. The app itself is not built. Each stage is given its detailed part here (the files, the words, the checks) when it is begun, after the code it touches has been read.

## What it is

Glaukopis on a phone, for the notebook. What turns up away from the desk is collected where it turns up: words written, a page or a passage shared from another app, a photograph, a file. It is on the writer's computers the next time they are opened, and the notes written at the desk are on the phone. Maps are shown and edited there later.

It is the same application in another role, not a second program: the same core, the same editor of the texts, the same notebook, with a page made for a narrow screen and a finger.

## Why now, and what it costs

The assistant's answer to "What do you think", so that it can be disagreed with.

**It is a good idea, and it is cheap now for three reasons.**

1. The notebook is for "anything while walking outside, taking a picture". Today all of that goes through another program first, and loses where it came from on the way.
2. What an app asked of the server on 2026-11-15 was built on 2026-11-22. A writer's computers share a home on a server, and a phone joins it with a code as a computer does. Nothing is added to the server.
3. The core has no Tauri in it and builds for Android with one dependency changed (below). Tauri 2 makes Android apps on the system's web view, so the editor and the notebook's model are used as they are. A program written for Android alone would need a second editor and a second reading of the notebook's document: the form of the texts in two places, and the editor deletes what it does not know (record 0111). That is advised against.

**What it costs, said plainly.**

1. A second platform to keep alive: one more file with every release, one more web view (Android's is Chromium's, the system's own, as WebView2 is on Windows; nothing is bundled), and the finger as a second way in beside the mouse.
2. One thing is not known: how the editor of the texts behaves under a phone's keyboard, with its suggestions and corrections. It is tried before anything else is built (stage 0), and the plan changes there if it does not hold.
3. Giving it out without a fee is possible, and is being narrowed by Google (see *Given out*).
4. A phone cannot hold everything, so "two synchronized devices hold the same things" is bent for a phone. The owner agreed (below).

## Decided by the owner

1. **An app for Android** that collects notes and sends them to the notebook.
2. **It synchronizes, and shows the notes.**
3. **Maps shown and edited may come, later.**
4. **Work goes to less expensive models** where that does not compromise quality at all.
5. From before: **nothing that costs a fee**, as things are now (2026-11-15); **an app shows projects as well, through the server** (2026-11-15), which is now the later part.

Agreed on 2026-11-22, when the plan had been read:

6. **A phone holds the notebook, the files its notes hold, and the references without their files.** Not the projects, until maps come, and then those that are opened; not the files of the library; not the settings, the styles, the formats, the templates or the words. The rule of the synchronization was that nothing is chosen; this chooses for a phone, because a library's files may be ten gigabytes.
7. **Two dependencies, for Android only**; the computers stay as they are. The network client reads TLS with `rustls`, since Android has no OpenSSL. (It was proposed as trusting what the phone trusts. The trial found that the computers trust Mozilla's list of authorities as it is compiled in, and the phone does the same.) And WorkManager, a library of AndroidX, by which Android runs a piece of work when there is a network: what was collected is sent with the app closed.
8. **A *device*, not a *computer***, in the words of the synchronization, on the computers as on the phone: Bokmål *enhet*. The list of the home, *Add a device…*, *Name of this device*.
9. **It works on any Android phone that people still use.** What that is taken to mean is in *Any phone that people still use*.
10. **The owner's phone** is a Samsung Galaxy S22 Ultra with Android 16: what the app is tried on by hand.

## The assistant's, not confirmed

To be told of again when it is built, with the other choices that await the owner.

1. **The same application in another role**, on the system's web view, as said above.
2. **A phone joins the writer's home with a code**, as a computer does. It can also be the first, and start the home. No account, and nothing new on the server.
3. **With the app closed**, what was collected is sent as soon as the phone has a network. What was written elsewhere is fetched when the app is opened. Nothing runs at regular times in the background.
4. **What is collected, and how**: see *Collecting*. A link shared is a note with the page as its source; nothing is fetched from the page.
5. **After Share, the app opens on the note just made**, so that a word or a tag can be added; Back goes to where one was.
6. **The first version is without**: the surface of a box, Join and Divide, links drawn between notes, the ways from a note into a text, import, starting texts, the tools of rich text. What a note holds of these is shown and kept, since the schema is the same.
7. **Android's own backup is turned off for the app**: the notes go to the writer's server and nowhere else.
8. **Given out as a file**, signed with a key the owner makes and keeps, on the website's page of packages and with the release on GitHub; F-Droid when the app has settled; not Google Play. See *Given out* for what Google asks from 2027.
9. **The app tells of a new version**, as the installations of Windows and macOS are told: nothing updates such a file by itself.
10. **The app is called *Glaukopis*.**
11. **No app for iPhone**: Apple asks a yearly fee. Nothing here stands in its way later.
12. **In the code the part is `phone`** (`src/lib/phone/`, `src-tauri/src/phone.rs`, `locales/*/phone.ftl`).
13. **"Still use" is taken to mean** Android 8 and later (the trial found that nothing made with Tauri starts on 7), both kinds of ARM processor, and a web view of version 111 or later: see *Any phone that people still use*.

## What stands in the code today

Read on 2026-11-22.

- **The core** (`crates/core`) is asked for nothing of a desktop by the notebook or the synchronization. Of libraries that are not Rust it needs two on Android (read from `cargo tree --target aarch64-linux-android`, nothing built): SQLite, which is compiled in (`bundled-sqlite`), and OpenSSL, through `ureq`'s `native-tls`, which Android does not have. `ureq` 3.4 has `rustls` and `platform-verifier` as features.
- **The engine** (`crates/core/src/sync/engine.rs`): `Sync::new(data, projects, notebook, library, hears)`, one thread, `once` for one round; what it has to tell goes through `Hears`. The notebook is the document `notebook`/`the` of the home; the files follow their records in the library's document (`files`, `stored`), where a file of the notes says so (`<hash>/notebook`). The home document's `facts` say what the list shows of each project without its content.
- **The shell builds the application in roles** (`src-tauri/src/lib.rs`, 927 lines): `run`, and `run_note_window` with a builder of its own, a short list of commands, a capability file of its own (`capabilities/note-window.json`) and a page of its own, which `src/main.ts` mounts where the window is labelled `note`. That is the pattern for the phone.
- **The inbox** (`crates/core/src/notebook/inbox.rs`): a thing is written whole into `notebook/inbox/<id>/` (`item.json`, a `Collected` of the kind `page`, `selection`, `image`, `region` or `note`, with its files beside it) by whoever collects, with no application running; the page takes it in as a note in the box that receives, with the page it came from as its source (`src/lib/notebook/inbox.ts`).
- **The notebook's interface**: the model (`src/lib/notebook/model/`) knows nothing of the page. `NotebookView.svelte` (1059 lines) is three columns for a wide window. `NoteList`, `NoteCard`, `NoteEditor`, `TagsField`, `SourceDialog`, `filters.ts` and `page.svelte.ts` are the parts a narrow page is made of.
- **The synchronization's section** (`src/lib/sync/SyncSettings.svelte`, 578 lines) with its commands (`sync_start`, `sync_join`, `sync_home`, `sync_code`, `sync_stop`, `sync_now`).
- **Mouse and finger**: the interface listens to the pointer in most places (88 uses in 46 files), to the mouse alone in 24 files, opens menus by the right button in 22, and acts on a double click in 25. The phone's page uses none of the last three as the only way to anything.
- **Tauri 2.12 with wry 0.57**: the web view of Android opens the camera for a field of files that asks for one (`RustWebChromeClient.onShowFileChooser`), and a plugin written in Kotlin is told of what other apps hand over (`Plugin.onNewIntent`).
- **This machine**: Android Studio, the platforms 36 and 37, NDK 29, the emulator with one system image (`android-36.1`), `adb`, KVM. Java is 27; the build uses the one Android Studio brings. No Rust targets for Android. 243 GB free; a build for one kind of processor is a whole build of the core.
- `/src-tauri/gen`, where Tauri puts the Android project, is ignored by git. Vite builds for `es2022` and `safari15`. The page has no history of places (`router.svelte.ts` replaces, never pushes).

## The shape

### The application in another role

- **The shell.** The sources of `src-tauri` are a second package, `src-phone`, built for Android alone and empty elsewhere, so that a build for a computer makes nothing for the phone (record 0121). The phone has a role of its own in `src-tauri/src/phone.rs`: one window labelled `phone`, the data folder in the app's own place (made and claimed as the application's is, `DataDir::open`: the phone's role is the only one at work in it), the engine, and only the commands the phone's page calls (the notebook's, the synchronization's, the languages, the settings, the log of the page). What is a desktop's alone stands behind `cfg(desktop)`: the single instance, windows made and placed, printing, the clipboard through GTK, the window of a note, Firefox. `lib.rs` is divided by role as this is done, not added to.
- **The same role on a computer**, `glaukopis --phone`, for trying only: a window as narrow as a phone, the phone's commands, the phone's page. It is in no launcher and not in the guide. Through it the harness that is there reaches nearly all of the phone's page.
- **The Android project** (`src-phone/gen/android`) was made by `tauri android init` and is committed, without what a build leaves in it: the manifest and the Kotlin of this plan live there. Tauri's tool is run from `src-phone` by its own place, never through pnpm, which starts it where it takes the application of the computers for the one to build.
- **The page.** `src/main.ts` mounts `src/lib/phone/mount.ts` where the window is labelled `phone`, as it mounts the window of a note: nothing of the projects, the diagram or the typesetting is loaded. Vite is told of the web view of Android beside `safari15`.
- **The core for Android.** TLS by `rustls`, as decided. Nothing is left out of the core for the phone: the trial found that the linker leaves out what the phone's role never calls, typesetting among it, and the app is 22 MB for one kind of processor.

### A phone among the writer's computers

The engine is told what this device takes: **everything** (a computer) or **the notes** (a phone). It is kept with what the device keeps of the synchronization (`sync/sync.json`), and a round on a phone is:

| Of the home | A phone |
| --- | --- |
| The home document | exchanged and read (`facts`, for the list of projects later). Nothing is written into it: no folder, favourite, setting, style or word of a phone is mirrored. |
| The projects | not touched: none fetched, none sent, none said to be gone. |
| The notebook | exchanged, as on a computer. |
| The library's document | exchanged, and its stores kept as on a computer: the references, the collections, the record of the files. |
| The files | a file is sent where it was taken in here. A file is fetched where its record says it is the notes'. Nothing else is fetched, and nothing is taken off the server by a phone. |

Three things follow, and each has a test against a real server (`crates/server/tests/`):

1. **A phone that leaves last.** The last device to leave takes the home off the server, and a phone does not hold what the server holds. Where a phone is the last, the question before *Stop synchronizing* says so in so many words: the projects and files that are on the server and not on this phone are deleted from the server. It is said, not forbidden.
2. **A newer form.** A phone whose app is older than the form of the notebook is refused by the server (`later`). It says that the app must be updated, and nothing of the notebook is sent or taken. The rest of its round goes on, as a computer's does: the references are in no form of the texts.
3. **A computer never learns of deletion from a phone's lack.** A project is gone only by the word `gone`; a phone never writes it.

### Collecting

| How | What it becomes |
| --- | --- |
| *New note* in the app, and on the app's icon held down | a note written straight into the notebook, in the box that receives |
| Share from another app: words | a note; the words a passage, which keeps how it read; no source, until the writer gives one |
| Share: an address and nothing else, with or without a subject | a note named by the subject, the page (address, title, the time) as its source; nothing is fetched |
| Share: pictures or files, with words or without | a note that holds them, each picture a figure, each with what the file says of itself (its name, when and where a photograph was taken), as files dropped on a computer |
| Words selected in another app, *Glaukopis* in the menu over them | as words shared |
| In a note: *Photograph* | the phone's camera, and the picture in the note |
| In a note: *Picture or file* | the system's picker |

Words with an address among them stay words: the program cannot know that the address is where the words are from.

What another app hands over goes the way the Firefox plugin's things go. A small part of the shell in Kotlin (in the Android project, no plugin from elsewhere) reads what was handed over, copies each file out of the other app's keeping, and gives the words and the names to the core, which writes one thing into the notebook's inbox: a new kind, `shared` (its words, its subject, its files). The page takes it in as it takes in the others. Nothing of it is read as HTML.

### The page of the phone

One column, three places: the notes, a note, the settings. Each is a step of the page's history, so that the system's Back goes from a note to the list.

- **The notes.** Newest first, one to a row: how it begins or its name, its first picture, when, its source in a line, its tags; those not yet looked at marked. A field to find in. A filter by box and tag, opened from the bottom of the screen.
- **A note.** The editor of the texts. Over the keyboard a row of the tools a note needs: bold, italic, a list, *To do*, a picture, a photograph, undo. Its name, its tags, its box, its source (shown, and set as on a computer). *Delete*, undone from the line that says it was deleted.
- **The settings.** Synchronization (the section there is, made to fit); the language; light or dark; the version, and that a newer one is out.
- **By finger.** Everything has a button, or a row in a menu opened by a button that is seen. A long press opens what the right button opens on a computer, and is never the only way. What is shown under the pointer (a ground, a colour, a thing that appears) is shown only where a pointer can be over a thing without pressing it: a touch screen leaves the last thing tapped as if the pointer stayed, and a tool turned off again looked on to the owner (found on the owner's phone, and mended for the buttons with an icon; the rest of the interface, some two hundred places, with the phone's page).
- **Without a network** everything works. A line at the top says so only where something waits to be sent or is wrong.
- The page is laid out in what the keyboard leaves. Light and dark, and the language, are the system's until chosen.

### Android's own

- **One way in.** Whatever starts the app from outside, the launcher now and Share and the icon's *New note* with stage 3, starts one small activity (`StartActivity`, stage 1), which looks at the web view and hands what it was given on to the activity of the page. Nothing else starts that one.
- **Asked of the system**: the network. The camera is the phone's camera app, which asks for nothing on the app's behalf. No notifications, no place, no contacts, no storage.
- **Backup to Google off** (`allowBackup`, and the rules of what is carried to a new phone), so that the notes go nowhere but to the writer's server.
- **Sent when closed.** After something was collected, Android is asked to run one round when there is a network (WorkManager; Tauri's Android project is built on AndroidX already, and this is one more library of it). The round is the core's `once`, reached through a small door of the shell that needs no window: the core has no Tauri in it.
- **The token** of the device lies in the app's own folder, which no other app reads.
- **The icon** is the owl, cut and scaled by `tauri icon`, on a plain ground.

### Any phone that people still use

The owner's word (2026-11-22). By Google's count of 1 October 2026, Android 8.0 or later is on 990 of 1000 devices in use, and Android 10 or later on 939.

| What decides it | What is done |
| --- | --- |
| The version of Android | Android 8.0 (2017) and later. Tauri says 7.0 and does not start there: found in the trial, on the emulator. |
| The web view | The page runs in the system's web view, and an old Android is left with an old one: Android 7 with version 119, Android 8 and 9 with 138, Android 10 and later with the newest (Chrome's numbers; that the web view's are the same is confirmed in stage 0). Of what the page uses, the newest came with version 111: colours mixed in CSS, in 77 places; `:has`, highlights and containers came with 105 (counted in the source). So every one of them will do, where it has been kept up. The app looks at the web view's version when it starts; where it is older than 111, or there is none, it says so in plain words, and how it is brought up to date. That is said by the Android part before the page is shown: the page does not run on a web view that old. |
| The processor | Both kinds of ARM: 64 bits, and the 32 bits that cheap phones were sold with until a few years ago. Done in the trial: the core builds for both, and its tests pass as a 32-bit program on an emulator but for those that ask for files of the machine they were built on. |
| The screen | From 320 points wide, the smallest phones, upwards; the scripts run the page at 320 and at 412. The letters follow the size the system is set to. |
| The keyboard | Samsung's (the owner's phone), Google's (the emulator) and Microsoft's: the editor is tried under each. |
| Phones without Google | The app asks nothing of Google's services, so it runs on a Huawei, and on LineageOS, GrapheneOS and /e/. |
| The newest Android | What Android 15 and 16 ask of every app. The page is drawn behind the system's bars, and the Android part keeps it clear of them and of the keyboard; the native library is laid out for memory pages of 16 KB (both done in the trial). The gesture for Back is the page's history's, with stage 2. |

The oldest web views kept up (119 no longer counts; 138 on Android 8 and 9) could not be tried: the emulators' images come with the web view of their day. It waits for a real old phone. A tablet shows the phone's page; a wider one is left for later.

### Given out

- One file for both kinds of ARM (some 22 MB for each kind), built by `tauri android build` in a capped unit, and by a job of the Installers workflow when the owner asks for one.
- **Signed with a key the owner makes and keeps**, outside the repository. An app signed with another key is not an update of the first, and the name `org.glaukopis.app` cannot be changed either: both are for good.
- On the website's page of packages and with the release on GitHub. `version.json` tells the app of a newer one.
- **F-Droid** later: it costs nothing and the licence fits; it builds from the source itself, which asks for a recipe of its own.
- **Not Google Play**: a fee of 25 dollars and a check of identity.
- **Google's verification of developers** (read on 2026-11-22, mostly in what others write of it; to be read again before stage 4). Since 30 September 2026 in Brazil, Indonesia, Singapore and Thailand, and in every other country in 2027, a phone with Google's services installs an app only from a developer Google has registered. Left open are `adb`, and a longer way for those who say they know what they do. Registering is free for up to 20 phones, with a Google account that has a payments profile in one's legal name, or 25 dollars and an identity check for more. F-Droid is not among the stores of the first phase and objects to the whole. **The owner's to decide before 2027**: the longer way and F-Droid, or the free registration.
- The plugin for Firefox has no part on a phone: Firefox for Android starts no helper. Share serves.

### Text read on the phone

Asked by the owner when the plan had been read (2026-11-22): mostly photographs of text, and PDFs too. A stage of its own, after *Given out*. Not decided.

What stands in the code:

- **Tesseract is a program the core starts** (`ocr/tesseract.rs`), given the picture, the languages and what it is to make. Windows and macOS bring it along beside the application (`resources/bin`); nobody offers one built for Android.
- **A picture is read as one page**, by Tesseract. **A PDF is taken apart only in a process of its own**, within limits (`isolated.rs`), and that process is the application started again. An app on Android cannot do that: it is no program, but a library in a process of Android's. The child has a program of its own for the tests (`crates/core/src/bin/glaukopis-isolated.rs`).
- **The data of a language** comes as a language package, 3 to 13 MB each, through the core (`languages.rs`).
- **The words read from a picture of a note** are kept with the notebook's record of its file, and so follow the notebook to every device. They are read when asked for, never by themselves (`src/lib/notebook/reading.svelte.ts`).
- **A picture can be turned by quarters, cut, and made lighter or darker** (`library/figures.rs`). Nothing straightens a page photographed aslant, and nothing is done about shadow.

What it takes:

1. **Tesseract and Leptonica built for Android** from their sources (Apache-2.0 and BSD), with the NDK, as a program that lies among the app's native libraries: the one place Android lets an app start a program from. The core is told that folder, as it is told of the one beside the application. Tried on the emulator before anything is built on it. The main thread's.
2. **The language packages in the phone's settings**: the list there is, made to fit. None comes in the file.
3. ***Read the text* on a picture of a note**, as on a computer.
4. **For PDFs, the child's program built for Android** and brought along the same way. Android may end what an app does once it leaves the front, so an article is read while one waits, and a book is for a computer. A phone holds no PDF of the library, as decided: what is read there is a PDF that came to the phone, in a note.

**Photographs are measured first**, before any of this is built: ten or twenty pages photographed with the owner's phone as they would be, read on this machine with the models there are: as they are, cut to the text, and with Tesseract's own ways with uneven light. Tesseract is trained on flat scans. The measure says whether photographs read well enough, and what the phone must do to one before it is read: cut by finger, straightened, its corners pulled square.

**For nothing, from stage 2**: a photograph taken on the phone is on the computer, where its text is read as today, and the words are then on the phone and found there.

## Trying it

1. **Tests beside the code** (vitest; `cargo test`), as always.
2. **The phone's page in the harness that is there**, through `glaukopis --phone`: scripts `e2e/phone-*.mjs`. With a server and a computer, as `e2e/synchronization.mjs` runs two applications and a server: a note written on the phone is on the computer, and the other way; a picture taken in on the phone arrives whole; the phone holds no project and no file of the library.
3. **Android's own, on the emulator** that is installed, without a window, in a capped unit (it takes some gigabytes of memory; never beside another capped unit): the app installed with `adb`, a share sent with `adb shell am start`, the page read and typed in through the web view's own door for debugging (the DevTools protocol over `adb forward`; a small client in `e2e/android/`, with Node's own WebSocket and no new package), screenshots into `e2e/output/`.
4. **The owner's phone**, by hand: the keyboard with its suggestions, Share from the browser, a photograph. Each stage ends with a short list of what to try.

## The stages

Each is committed when it is checked. Stages 0 to 4 are the app the owner asked for; the rest come later, each with a plan of its own.

0. **The trial. Done on 2026-11-22: record 0121.** The editor holds under Google's keyboard; Samsung's is the owner's phone's to answer, with the app built for it. As it was planned: The Rust targets for Android; TLS; the shell built for Android with one window that holds the editor of the texts and keeps a note. On the emulator and on the owner's phone. It answers: whether the core builds, for 64 bits and for 32, and whether its tests pass as a 32-bit program; how large the file is, and so whether typesetting is left out; **whether the editor holds under a phone's keyboard**, Samsung's on the owner's phone and Google's on the emulator (typing with suggestions, Enter, Backspace over marks, lists, selecting, pasting); whether the page keeps clear of the system's bars and follows Back on Android 16; how the oldest web views are tried; whether a share arrives; whether the camera opens; whether the harness reaches the emulator; how long a build takes and what it leaves on the disk. Should the editor not hold, the plan stops here and is told: the way left is notes written in a plain field and shown as they are, which is a lesser app and the owner's to choose. Ends with the record, and this plan corrected by what was found.
1. **The role, and what a phone takes.** The shell divided by role, `glaukopis --phone`; a web view too old said by the Android part; the engine told what a device takes, with its tests against the server. (The phone's data folder and the backup turned off were done in the trial.) Its detailed part is *Stage 1, in detail*, below.
2. **The notes shown, found and written; the synchronization set up.** The page of the phone. *Device* for *computer* in the words of the synchronization, on the computers too, with an addendum to its record. From here the owner has an app to use: a note written on the phone is on the computer.
3. **Collecting.** Share, the selection's menu, the photograph, pictures and files, *New note* on the icon; sent when closed.
4. **Given out.** The signed file, the job of the workflow, the newer version told, the website's folder, the chapter of the guide, the other languages in a round.
5. *Later, should the owner want it:* **text read on the phone.** Photographs measured first; then Tesseract brought along, the languages, *Read the text*; PDFs after.
6. *Later:* the rest of the notebook by finger: the surface of a box, Join and Divide, links.
7. *Later:* **maps shown.** The tree of projects from the home document; a project fetched when it is opened and kept from then on; read as text and as the diagram.
8. *Later:* **maps edited.**

## Stage 1, in detail

Written on 2026-11-23, after the code it touches was read. Where it says a file, a name or a shape, that is what is built. A builder who finds the code otherwise than it is said here stops and says so, and does not choose. Writing it corrected the plan above in four places: the phone's data folder is made and claimed as the application's is, not `DataDir::at`; a phone refused for a later form of the notebook goes on with the references; whatever starts the app from outside enters by one activity; and the Kotlin of this stage has its row in *Who builds what*.

Three parts. They meet in one name, `Takes`, which part A makes and part B uses.

| Part | Who | Where |
| --- | --- | --- |
| A. What a device takes, in the engine, with its tests against the server | the most capable model, as an agent in a worktree. Its diff is read once more by the most capable model, as a second agent that is given the diff and this section and not the builder's account, before it is merged | `crates/core/src/sync/`, `crates/server/tests/` |
| B. The shell divided by role; the phone's role; `glaukopis --phone` | the main thread | `src-tauri/`, `src-phone/capabilities/`, `crates/core/src/paths.rs`, `src/main.ts`, `src/lib/phone/`, `e2e/phone-role.mjs` |
| C. The web view looked at by the Android part | the main thread | `src-phone/gen/android/`, `e2e/android/`, `vite.config.ts` |

Nothing of this stage is seen by a writer at a computer, and on a phone that is kept up nothing is seen either: the app starts as it did in the trial. No word of the interface changes, no command is added, `contract.generated.ts` stays as it is, and the guide is not touched.

### A. What a device takes

Read before building: `crates/core/src/sync/engine.rs`, `kept.rs`, `files.rs`, `library.rs`, `home.rs`, `mirror.rs`, `remote.rs`; `crates/core/src/library/notebook.rs` and `files.rs` (what it is for a note to hold a file); the three files of tests beside the new one; `docs/plans/the-same-on-every-device.md`.

**The name, and where it is kept.** In `kept.rs`, sent on by `sync/mod.rs` (`pub use kept::Takes`):

```rust
/// What a device takes of its home.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Takes {
    /// Everything: a computer.
    #[default]
    Everything,
    /// The notes: a phone. The notebook, the files its notes hold, and the references without their files.
    Notes,
}
```

`Joined` gets the field `takes: Takes`, so `sync/sync.json` says `"takes": "notes"` or `"takes": "everything"`. A `sync.json` written before there was such a field says nothing of it and is read as `everything`: only computers could join then.

**How the engine is told.** `Sync::new(data, projects, notebook, library, takes, hears)`: the role that makes the engine says what it is, the application `Takes::Everything`, the phone `Takes::Notes`. `enter`, which `start` and `join` both end in, writes it into `Joined`. From then on **a device does no more than its role and what it joined as both allow**: `Takes::narrower(self, other)` gives the one where they are the same and `Notes` where they differ, and `round` asks it once, of the role's and the kept one, and hands the answer down. Everything by which a round can take a document or a file off the server, or say that a project is gone, belongs to `Everything`, so it then takes two things to be wrong, the program and the file, before a phone does what only a computer may. Where they differ when the engine is made, it is logged once (`tracing::warn!`), and nothing is said to the writer: it does not happen to a device that is used as it was set up. `Status` is as it was.

**A round on a phone.** `Sync::round`, step by step. The first column is the code as it stands, which a computer goes on doing to the letter.

| In `round` | A computer | A phone |
| --- | --- | --- |
| `home.list`, and the two documents of maps read from `sync/` | as it is | the same |
| `met` | as it is | not called |
| `home_round` | as it is | `home_read` in its place, below |
| `projects_round` | as it is | not called. So no project is listed, fetched, sent, moved to the trash or said to be gone, no document is taken off the server, and `sync/base/gone.json` and `trash.json` are never written |
| `notebook_round` | as it is | the same |
| `library_round` | as it is | the same, its four stores mirrored both ways as on a computer; `files::bring` is told `takes` |
| the home document sent at the end, where it is marked unsent | as it is | not done |

`home_read(home, joined, doc, docs)`, new, beside `home_round`: where the server's digest of `home/the` is not the one last seen, the document is exchanged **with nothing sent**, what came is taken in and kept in `sync/home.bin` with what was seen of it; then, as `maps_round` does, a home document in a later form than `HOME_FORM` ends the round with the words there are for it (`core-sync-later-home`). Nothing else: the form is not begun by a phone (`HomeDoc::begin` is not called), no store is given, so nothing of the folders, the favourites, what the list shows, how a project is shared, the settings, the styles, the formats, the templates or the words is read from the phone's disk or written to it, and no `sync/base/` file of theirs is made. The maps lie in `home.bin` as they came, for the list of projects later. The word `gone` in it is not acted on.

For that, `exchange_maps` gets one more argument, `send: bool`. The four calls there are give `true` and do what they did. With `false`, what is handed to `ask` as the document's own (`mine`) gives nothing whatever it is asked, so that no change goes with the exchange, also where `ask` asks a second time because the server holds less than it did; and the mark that the document holds something unsent (`mark_unsent`) is left as it is. The rest of it is the same.

`files::bring(home, library, doc, told, note, written, takes)`. Its three rules, on a phone:

1. **Sent**: as on a computer. A file a record names that is here and that `stored` does not name is sent, and `stored` says so.
2. **Fetched**: one a record names, that `stored` names, that is not here, **and whose record says the notes hold it**: the name `<hash>/notebook` of the map `files` is `also` or `only`. `Named` gets a field for it. Nothing else is fetched.
3. **Taken off the server**: never. The loop over what `stored` names and no record names is not run on a phone.

What a file that is refused as not there does to `stored`, and a file found on the server already, stay as they are.

**Every call that writes to the server, and whether a phone makes it.** The second reading goes through this table against the diff, call by call.

| Call | Made in | A phone |
| --- | --- | --- |
| the exchange of `home/the` with changes | `exchange_maps`, from `maps_round` and at the end of `round` | never: it asks with nothing sent |
| the exchange of `project/<id>` | `exchange_project`, `fetch_project` | never |
| `DELETE` of a document | `project` | never |
| the exchange of `notebook/the` | `notebook_round` | as a computer |
| the exchange of `library/the` | `library_round` | as a computer |
| a file sent | `files::bring` | as a computer |
| a file taken off the server | `files::bring` | never |
| this device removed, and with the last the home | `stop` | as a computer |
| a code made, a device renamed, another removed | `code`, `rename`, `remove` | as a computer |

**What holds it.** A new file, `crates/server/tests/phone.rs`, with the engine on each device and the real server between them, as `synchronization.rs` and `synchronized_library.rs` do it. It has a device of its own to work with (`Device::computer()`, `Device::phone()`: made as `Computer::new` of the two files is, `Takes` the one difference between the two), and the helpers it needs are copied from those files, not moved into a module: the three files stay readable each by itself. The two files there are change by the one argument (`Takes::Everything`) and by nothing else, and so hold a computer to being what it was.

The three things the plan says follow, each by its test:

1. *A phone that leaves last*: `a_phone_that_leaves_last_takes_the_home_and_what_it_never_held_off_the_server`. A computer makes the home with a project and a file of the library; a phone joins; both settle; the computer stops. The server still lists `project/<id>` and holds the file, through as many rounds of the phone as one likes. `told()` on the phone names one device: that is how the page will know that it is the last. The phone stops: the server lets its token in no more, and the home's folder is gone from the server's disk, the project and the file with it. The computer holds its project and its file as it did, and the phone its notes. The words of the question are stage 2's, and say what this test shows.
2. *A newer form*: `a_phone_older_than_the_form_of_the_notebook_is_refused_and_the_rest_of_its_round_goes_on`. A computer and a phone in a home, a note on both. The computer adds a reference and makes its round. The notebook on the server is then written in a later form, by an exchange made straight through `remote::Home` with the computer's token, the form `sync::FORM + 1`, and a change that puts that form's name into the map `form` (as `Copy::raise_form` of `homes.rs` does) with a note beside it. The phone writes a note and makes a round. The round gives one problem and no error; the digest of `notebook/the` on the server is what it was before the round; the phone's notebook holds its own note still, and not the later one; and the reference is on the phone, since the round went on. (The test does not read the words of the problem: they are those there are for a later version, `core-sharing-later` within `core-sync-problem-notebook`.)
3. *A computer never learns of deletion from a phone's lack*: `a_computer_never_learns_of_deletion_from_what_a_phone_lacks`. A computer with a project in a folder, a favourite, a setting changed, a style of its own, a reference with a file, a file of the library alone. A phone joins; they settle twice over. A second computer joins; all three settle. Both computers hold the project (and not in the trash), the folder, the style, the setting and both files, byte for byte; the server lists the project and holds both files; the map `gone` of the home document, as the first computer keeps it, is empty.

And these, which hold the rest of the table:

4. `a_phone_holds_the_notes_and_the_references_and_no_project_and_no_file_of_the_library`. The computer of the third test, with a note, a picture a note holds (`notebook_take_image`) and, another picture, an image of a project besides. On the phone after it has settled: the same notes; the picture, byte for byte; the library as the computer says it, reference by reference and record by record (`library_as_said` of `synchronized_library.rs`); no file of the store but the picture; no project, and none in the trash; `settings.json` without the computer's setting; no style; in `sync/base/` the four stores of the library and nothing else; `"takes": "notes"` in `sync.json`; and `home.bin` holding what the list shows of the project (`facts/<id>`).
5. `a_note_written_on_a_phone_and_a_picture_taken_there_are_on_the_computer`. Both arrive, the picture byte for byte with its record saying the notes hold it alone, and the server holds the picture.
6. `a_phone_fetches_a_file_once_a_note_holds_it_and_takes_none_off_the_server`. A file of the library is not on the phone; a note comes to hold it on the computer (`notebook_hold`), and after they settle it is. Then a picture taken on the phone, which both hold and the server too, is swept out on the phone as when its note is gone (`notebook_sweep` with nothing held; `remove_file` does not take out what the notes hold). After the phone's round the record is out of the library's document and the server holds the file still; after the computer's round the server does not.
7. `nothing_of_a_phones_own_projects_settings_or_styles_reaches_the_home`. In a home a computer made. Put into the phone's folder by hand: a project, a setting that follows the writer (`theme`), a style. After the phone's rounds the server lists no such project, and the digest of `home/the` is what it was before them.
8. `a_phone_may_start_the_home_and_a_computer_that_joins_brings_everything`. The phone starts with a note and a picture; the server has no `home/the` after its rounds. A computer joins with a project, a reference and a setting: the home document is there, made by the computer; the computer holds the note and the picture, the phone the reference and no project.
9. `a_device_does_no_more_than_its_role_and_what_it_joined_as_both_allow`. A folder joined as a phone and then given an engine that says `Everything`, with a project made in it: the project is not sent. A folder joined as a computer and then given an engine that says `Notes`: what is written into its project after is not sent, and the home document is not written into.

Beside the code: in `kept.rs`, that what a device takes is kept and read again, and that a `sync.json` without it is read as `everything`; and that `narrower` gives `Notes` wherever the two differ.

In `src-tauri/src/commands/sync.rs`, `engine` gives `Takes::Everything` to `Sync::new`; nothing else of the shell changes with this part. The words at the head of `engine.rs`, `kept.rs` and `files.rs` are brought up to date, and `docs/plans/the-same-on-every-device.md` gets one line, where it says what `sync.json` holds.

### B. The shell divided by role

**B1, the division, with nothing done otherwise than before.** `src-tauri/src/lib.rs` becomes five files. Everything is moved as it is: what changes is where a thing lies and that it is `pub(crate)`.

| File | What it holds |
| --- | --- |
| `lib.rs` | The modules; what `main.rs` calls (`run`, `run_note_window`, and with B2 `run_phone` and `phone_asked`, each a `pub use` behind `cfg(desktop)`); and where Android starts the application (`start`, behind `cfg(mobile)`, which calls `phone::run`). |
| `starting.rs` | What every role starts with: `context`; `Opening` and `opening`, with their four tests; `speak_as_chosen`; `testing`; `say_and_end`; `failed(app, error, log)` and `in_use(app, root)`, which say that the application could not start, or that its folder is in use, and end it (out of `Start::failed` and `Start::open`, which call them); `tell_the_windows(app)`, which is the two hooks of `run`'s setup (what the core tells without being asked, and what changed on disk, which also touches the engine); the compositor of WebKitGTK (`COMPOSITOR_SWITCH`, `previous_compositor`, and `say_compositor(asked)` for the line of the log that two roles write alike); `show_late` and `watch`. |
| `application.rs` | The application on a computer: `run`, `Start`, `make_windows`, `window_builder`, `make_window`, `started_again`, `placed`, `SHARED_WEB_PROCESS`, and the test that the windows are made by the application. |
| `note_window.rs` | The window of a note: `NOTE_WINDOW`, `run` (which was `run_note_window`), `make_note_window`. |
| `phone.rs` | The phone: in B1 as the trial left it, but for where it finds what moved. B2 makes it the role, and the same role on a computer. |

What stands behind what, when B2 is done:

- `cfg(desktop)`: `mod application` and `mod note_window`, whole; in `starting.rs`, `show_late` and `watch`; in `commands/mod.rs`, `pub mod printing` (the arm for a phone in `print_pages` goes with that); in `commands/system.rs`, `window_new`, which calls `application::make_window`; in `commands/notebook.rs`, the three commands of Firefox with what only they use (`this_program`, `FirefoxSetup`, what they import); in `phone.rs`, what B2 says. All of these but the last are done in B1.
- `cfg(mobile)`: `start` in `lib.rs`, and in `phone.rs` where the data folder is. (`mod phone` itself is behind `cfg(mobile)` until B2, and behind nothing after.)
- `cfg(target_os = "linux")`: what has it today.
- The trial's `#![cfg_attr(mobile, allow(dead_code, unused_imports))]` over the whole library stays through B1, where the phone does not yet use what the roles share, and **goes in B2**. In its place, on two lines of `lib.rs` and nowhere else: `#[cfg_attr(mobile, allow(dead_code))]` on `mod commands` and on `mod state`, with the reason beside it. A role registers the commands its page calls; on a phone the others lie unused and the linker leaves them out (record 0121). They are not put behind `cfg(desktop)` one by one: stage 2 registers more of them for the phone's page, and its builders do not build for Android. On a computer nothing is allowed, and a command that no role registers fails the check as it does today. `unused_imports` is allowed nowhere.

The tests in `commands/notebook.rs` that open a folder say `crate::starting::opening`.

**B2, the phone's role.** `phone.rs`, for Android and for a computer alike but for what is marked.

- **The window** is labelled `phone` (`WINDOW`). It is `phone` and not `note` now, in this stage, for two reasons. What a page may do is given to a window by its label, and on a computer the window of a note may close and destroy itself while the phone's must not: a window that cannot close is how the page knows that it stays (record 0121), so the two cannot share a label there. And stage 2 then changes one line of `src/main.ts` and nothing of the shell, the capabilities or the Android project.
- **The data folder.** On Android, `files/data` in the app's own folder, as in the trial. On a computer, `glaukopis_core::paths::phone_root()`, new: `GLAUKOPIS_DATA_DIR` where it names one, else `glaukopis-phone` in the system's place for the data of programs (beside `glaukopis`, never in it). The file that says where the writer chose to keep the data is not read. **It is never the application's usual folder**: where the environment names that one (the same path, or the same folder where both are there), `phone_root` gives an error, and the program says so on the standard error, in English as the log is, and ends with 2. That is done first of all in `run` on a computer, before anything of Tauri is built; on Android the folder is asked of the app in `setup`, as in the trial. Tested beside it, by a function that is given the environment and the place as `root_in` of the window of a note is.
- **What it starts with**: on Linux the previous compositor is asked for first, as the other two roles ask. Then, in `setup`, which returns no error: the log of the run in the folder (`log::start`); `starting::tell_the_windows`; then `starting::opening(root, false, None, speak_as_chosen)`, the same as the application's, so the folder is made, claimed, and read into the same `AppState`. That is what the commands of stage 2 ask for, and what the engine shares its stores with. A folder in use, or one that cannot be opened, is said and ended as the application says it (`starting::in_use`, `starting::failed`), and no window is made.
- **The engine** is made now: `commands::sync::engine(app, &state, Takes::Notes)`, which gets `takes` as its third argument (the application gives `Takes::Everything`). It is managed, and run once the window is made. On a phone nothing can join a home before stage 2, and an engine that is in no home asks nothing of anyone. It is made now so that what the role gives it is tried in the running program by the script below, before any page leans on it.
- **Also managed**: `NoteWindowState`, for the page the role shows until stage 2, of the same folder (`NoteWindow::new(DataDir::at(root))`: it claims nothing, and the state beside it holds the claim).
- **The commands**, these and no others: `note_window_start`, `note_window_keep`, `note_window_send`, `note_window_add_files`, `note_window_add_bytes`, `note_window_file_path`; `fonts_list`; `languages`, `log_page`, `file_read`; `clipboard_read`; and of the synchronization `sync_status`, `sync_computer`, `sync_start`, `sync_join`, `sync_home`, `sync_code`, `sync_rename`, `sync_remove`, `sync_stop`, `sync_now`. Not `project_apart` and `project_apart_seen`. No command of the notebook, the settings or the projects: stage 2 adds those its page calls.
- **Plugins**: the dialog, as today. No single instance: beside the application and never through it, as the window of a note is.
- `state::find_resources` gives an empty path where it has nowhere to look, where today it would end the program: a phone has no folder of resources.

**`glaukopis --phone`**, the same role on a computer, for trying only. It is in no launcher, no package's command and not in the guide.

- **Asked for** as `--note` is: `phone::asked(args)` (`--phone` among the arguments, wherever it stands; `FLAG`), looked at in `main.rs` after `--note` and before `run`. `asked`, `FLAG` and the window's measures are behind `cfg(desktop)`.
- **The window**: 412 by 915, no smaller than 320 by 480, resizable, titled *Glaukopis*, made hidden and shown by its page as every window on a computer is, with `show_late` and `watch`; the hook of the scripts where the harness runs it (`testing`). On Android the window is made with its label and nothing more, as in the trial: a phone's window has no measures to set.
- **What its page may do**: `src-tauri/capabilities/phone.json`, new, for the window `phone`: `core:default`, `dialog:allow-open`, `core:window:allow-show`. `src-phone/capabilities/phone.json` names the window `phone` in place of `note` and keeps `core:default`, `dialog:allow-open`. A test in `phone.rs` reads both files: both are for the window `phone` and no other; neither lets the page close or destroy it; and the computer's has what the phone's has and `core:window:allow-show`, nothing more.
- **Its page**: `src/lib/phone/label.ts`, new, as `notebook/window/label.ts` is: `PHONE_WINDOW = 'phone'` and `isPhone()`. `src/main.ts` mounts the page of the window of a note where `isNoteWindow() || isPhone()`, and says beside it that the phone's own page takes its place in stage 2 (`src/lib/phone/mount.ts`). Nothing else of the interface changes.
- **How the harness starts it**: `App.launch({ args: ['--phone'], dataDir, keepData: true, width: 412, height: 915 })`. The harness sets `GLAUKOPIS_DATA_DIR`, so the folder is the run's own; nothing of `harness.mjs` changes.

**The script that tries it**: `e2e/phone-role.mjs`, new, written and run by the main thread. With the real server, the application as a computer, and `glaukopis --phone` as the phone, each in a folder of the run, made as `e2e/synchronization.mjs` makes its two:

1. The role starts: one window, labelled `phone`, 412 wide, showing the page of a note.
2. A command of the projects is not the phone's (`project_list` is refused), and one of the synchronization is (`sync_status` says off).
3. A note is written and sent: the window stays, the field is emptied and says that the note is sent, and the note lies in `notebook/inbox/` of the phone's folder. (Nothing takes it in before stage 2.)
4. The computer starts a home (`sync_start`), and holds a project, a reference with a file, a note and a setting changed; it makes a code (`sync_code`). The phone joins by the command (`sync_join`), since it has no page to join from, and makes a round (`sync_now`) until it says when everything was last the same.
5. In the phone's folder then: `sync/sync.json` says `"takes": "notes"`; `library/library.bib` holds the reference; the notebook's folder holds a document; `projects/` holds no project; `settings.json` lacks the computer's setting; the store of files holds no file.
6. No errors in either page. Screenshots in `e2e/output/phone-role-<n>-<what>.png`.

### C. The web view looked at by the Android part

`WryActivity`, which `MainActivity` is, starts Rust in its `onCreate`, and an activity cannot leave its parent's `onCreate` uncalled. So `MainActivity` cannot look before the page: by then the library is loaded and the window on its way, and with no web view the app stops (seen in the trial). The looking is an activity of its own, which loads nothing of ours.

- **`StartActivity.kt`**, new, beside `MainActivity.kt`: an `AppCompatActivity` with the app's theme. It is what the launcher starts. The manifest moves the intent filter (`MAIN`, `LAUNCHER`, `LEANBACK_LAUNCHER`) from `MainActivity` to it, and makes `MainActivity` `android:exported="false"`: nothing but the app starts the page. (Tauri's `android dev`, which is not used here, starts `MainActivity` by its name and would be refused. The app is built, installed with `adb` and started by its launcher's activity, as the scripts do it.)
- **It looks in `onResume`**, so also when one comes back from the app store, and the least version is one constant, `LEAST_WEB_VIEW = 111`:
  1. `WebView.getCurrentWebViewPackage()` (there from Android 8.0, the least Android; nothing is loaded by asking). None: **there is no web view**.
  2. The package is one whose version is Chromium's: its name begins with `com.google.android.webview`, or is `com.android.webview`, or begins with `com.android.chrome` or `com.chrome.`. The number before the first full stop of its `versionName`: below 111, **too old**; else it will do. Nothing of the web view is loaded for this, so one that does not load cannot stop the app here.
  3. Any other package (a maker's own, whose version is not Chromium's and says nothing), or a version that cannot be read: `WebSettings.getDefaultUserAgent(this)`, within a `try` that catches every `Throwable`. Thrown: **no web view** that can be used. `Chrome/<number>` in it with a number below 111: **too old**. Anything else will do: what cannot be known is not refused.
- **Where it will do**: `startActivity` of `MainActivity`, `finish()`, with no transition between them. Nothing is shown.
- **Where it will not**: a plain view made in the code, no dialog: a title, the words, and under them a button, one under the other with a margin of 24, in a view that scrolls, kept clear of the system's bars as `MainActivity.keepClear` keeps the page; letters in `sp`, so that they follow the size the system is set to; light or dark as the system is. The app does not go on. Back leaves it.
- **The button**, *Open the app store*, is there where Android named a package: it opens `market://details?id=<that package>`. Where no app answers (`ActivityNotFoundException`), the button is taken away. Nothing is asked of Google's services by it: any store answers such an address.
- **With stage 3**, what another app hands over arrives here and is handed on with the intent as it came; nothing of that is built now.

**The words** are Android's own string resources: the page and the core are not running when they are shown. `res/values/web_view.xml` and `res/values-nb/web_view.xml`, new, with the same four names; `%1$d` is the version found, `%2$d` the least.

| Name | English | Bokmål |
| --- | --- | --- |
| `web_view_title` | Glaukopis cannot start on this device yet | Glaukopis kan ikke starte på denne enheten ennå |
| `web_view_too_old` | Glaukopis is shown by Android System WebView, a part of Android that is updated as an app is. This device has version %1$d of it, and Glaukopis needs version %2$d or later.<br><br>Update Android System WebView in the app store of the device. On some devices it is Chrome that is to be updated. Then open Glaukopis again. | Glaukopis vises av Android System WebView, en del av Android som oppdateres slik en app blir. Denne enheten har versjon %1$d av den, og Glaukopis trenger versjon %2$d eller nyere.<br><br>Oppdater Android System WebView i enhetens appbutikk. På noen enheter er det Chrome som skal oppdateres. Åpne så Glaukopis igjen. |
| `web_view_none` | Glaukopis is shown by Android System WebView, a part of Android that is updated as an app is. This device has none that can be used.<br><br>Install Android System WebView from the app store of the device, or turn it on among the apps in the settings. Then open Glaukopis again. | Glaukopis vises av Android System WebView, en del av Android som oppdateres slik en app blir. Denne enheten har ingen som kan brukes.<br><br>Installer Android System WebView fra enhetens appbutikk, eller slå den på blant appene i innstillingene. Åpne så Glaukopis igjen. |
| `web_view_store` | Open the app store | Åpne appbutikken |

(The break between the two paragraphs is `\n\n` in the resource.) `res/values-nb/strings.xml`, new, repeats `app_name` and `main_activity_title` as they are: a release is refused by Android's own check where a language lacks a name the others have. The other seven languages get theirs in the round of stage 4, and read English until then.

**The number stands in two places**, and they are changed together: `LEAST_WEB_VIEW` in `StartActivity.kt`, and `chrome111` beside `safari15` in the `build.target` of `vite.config.ts`, which this part adds.

**How it is tried.** `e2e/android/device.mjs`: `start()` starts `.StartActivity`; and `screenText()`, new, gives the words on the screen where there is no page to ask (`uiautomator dump`). `e2e/android/web-view.mjs`, new:

- On the old device (`e2e/android/emulator.sh start old`, then `ANDROID_SERIAL=emulator-5586`), whose web view is older than the page can use: the app started, its process is there after some seconds, the screen holds the title and one of the two messages and not Android's words that the app has stopped; which message, and the version it names, are printed. Then the web view is taken away for the user of the device (`pm uninstall --user 0`, of the package `dumpsys webviewupdate` names), the app started again: the words for none. It is put back (`cmd package install-existing`), and the first message is there again. The script takes a web view away on `emulator-5586` and on no other device, and says so and ends where it is told another.
- On the new device: the app started, and the page of a note is there. `e2e/android/typing.mjs` is run once more as well: the app starts and is typed in as before.
- Screenshots in `e2e/output/android-web-view-<n>-<what>.png`.

What the old device says is written into the record of this stage. Should it show something this section did not foresee (the app stopping in `StartActivity` itself), that is told before anything is built around it.

### Words

- **No message of Fluent is added or changed**, in `locales/` for the interface or for the core. What the stage has to say is said by messages there are: a folder in use and a failure to start (`core-in-use-title`, `core-in-use`, `core-start-failed-title`, `core-start-failed`, `core-start-failed-log`), a home document in a later form (`core-sync-later-home`), a notebook in a later form (`core-sharing-later` within `core-sync-problem-notebook`). Those of the synchronization say *computer* where stage 2 will say *device*, and are left so until then.
- **Four strings of Android's**, in English and Bokmål, in the table of part C: the only words of this stage that anyone reads.
- What `glaukopis --phone` says of a folder it refuses, and what the engine logs where a role and a file differ, are lines of the log, in English as the log is.

### The order of the work, and what each step is checked by

Edits first, then `cargo fmt --all` and `pnpm format`. Every step is committed when its checks pass.

1. **A is built**, by its agent, alone: nothing else is compiled into the same `target/` meanwhile. Checked by the agent: `cargo test -p glaukopis-core -p glaukopis-server -p glaukopis` (all of the server's tests, the new file among them; the shell compiles and its contract test leaves `contract.generated.ts` as it was); `cargo clippy --workspace --all-targets -- -D warnings`; `pnpm check` and `pnpm test`. No script, no build for Android.
2. **A is read once more** by the second agent, which builds nothing; and meanwhile **B1** by the main thread, checked by `cargo test -p glaukopis`, clippy for computers as above, and clippy for Android: `. packaging/android/env.sh && cargo clippy -p glaukopis-phone -p glaukopis-core --no-default-features --target aarch64-linux-android -- -D warnings`. Then `pnpm e2e:build` and one script, `e2e/note-window.mjs`: the roles of a computer start as they did.
3. **A is merged** when the reading found nothing, or what it found is mended and read. The main thread runs `cargo test -p glaukopis-server` on what was merged, builds the server (`cargo build -p glaukopis-server`) and runs `e2e/synchronization.mjs`: two computers are the same as before.
4. **B2**, checked by `pnpm check`, `pnpm test`, `cargo test -p glaukopis-core -p glaukopis`, both clippies, `pnpm e2e:build`, then `e2e/phone-role.mjs` and `e2e/note-window.mjs` again (`main.ts` changed).
5. **C**: the app built for trying in a capped unit, as in the trial; then `e2e/android/web-view.mjs` on the old device and on the new, and `e2e/android/typing.mjs` on the new, one emulator at a time and never beside another capped unit. Clippy for Android once more. `pnpm check` and `pnpm test`, for `vite.config.ts`.
6. **The end of the stage**, by the main thread: the record of it (`docs/adr/0122`, with its line in `docs/adr/README.md`): what a device takes, the web view looked at before the page, the role on a computer, what the old device said, and how large the release now is for one kind of processor, since the phone's role now reaches the engine and the state. The map in `CLAUDE.md` (the shell in its files, `glaukopis --phone`, `e2e/phone-role.mjs`). This plan: the stage marked done, and corrected by what was found. The owner is told what was chosen here.

Three scripts of the computer's harness, one of them twice, two to three minutes a run; and three runs on the emulators. No other script is run: no page of the application changed.

### Left out of stage 1

So that no builder adds it.

- **The page of the phone**, all of it (`src/lib/phone/mount.ts` and what it mounts): the role shows the page of a note. With it go `fonts_list` out of the phone's commands and `commands/notewindow.rs` behind `cfg(desktop)`: stage 2.
- **Joining a home from the phone**, the settings of the phone, and *device* for *computer*: no word of the synchronization changes now, in the interface or in the core. What the system calls a phone (`sync_computer`) is stage 2's.
- **The question before *Stop synchronizing* on a phone that is the last.** Stage 2 writes it, from what the first test shows.
- **Any command of the notebook, the settings or the projects** on the phone. **Taking in the inbox** there: a note sent from the phone's field in this stage waits in the inbox.
- **Sweeping out the files no note holds** (`notebook_sweep`) is not the phone's in this stage. Stage 2 says when a phone does it, and reads this first: a file swept out by mistake on one device is told again by another that holds it, and in a home of phones alone there may be no other.
- **`Status` and the contract**: unchanged. No new command, no new event.
- **Rounds while the app is not in front, and a round when it comes back**: stage 2, with joining. **A round with the app closed**, Share, the icon's *New note*, the kind `shared`: stage 3.
- **The tree of projects** read from `facts`: later. The phone keeps the home document and reads nothing from it.
- **A file that was the notes' and is no more** stays on the phone. **A file on the server that no record names** stays there until a computer of the home makes a round.
- **The shell's commands sorted into a phone's and a computer's**, one by one. **The helpers of the three files of tests** made one module.
- **Tests of the Kotlin** run by Gradle. **The key, the signed file, the workflow**: stage 4.

### Chosen here, to be told

With the other choices that await the owner.

1. A device does no more than its role and what it joined as both allow.
2. A phone that meets a home document in a later form stops its round and says that Glaukopis must be updated, as a computer does; one that meets only a notebook in a later form goes on with the references.
3. `glaukopis --phone` keeps its data in a folder `glaukopis-phone` beside the application's, and refuses the application's own.
4. On a phone, what a role does not use of the shell is allowed to lie unused, in two lines, in place of the trial's one line over everything.
5. The screen that says the web view is too old or missing: a plain view, its words, and *Open the app store*.
6. `MainActivity` is started by the app alone.
7. A phone keeps the whole home document, as the plan says, and so also what it does not use of it: the settings that follow the writer, the styles, and the key of each shared project. It lies in the app's own folder, which no other app reads.

### For the owner

Nothing here stops the building. Two things are the owner's to say:

1. **The words of the screen** that says the web view is too old or missing, in English and Bokmål, in the table above. They are built as written until said otherwise.
2. **A home with only phones in it never grows smaller on its server**: a phone takes nothing off the server, so a file that no note holds any more lies there until a computer of the home makes a round. That is the rule as agreed, and the careful one. Should a phone be let take such a file off, it is one rule changed in `files::bring`, with a test.

## Who builds what

The way that held on 2026-11-13 and 2026-11-16: the main thread reads the code, settles every choice and writes one part of the plan for each agent (the decisions, the files, the names and properties where two parts meet, what to verify); each agent builds in a worktree of its own; the main thread reads every diff, merges, builds once and runs the application.

| Part | Who | Why |
| --- | --- | --- |
| Stage 0, all of it | the main thread, on the most capable model | Done. Every finding changed the plan. |
| 1: the shell divided by role, `--phone` | the main thread | It goes on from the trial's own code, through `lib.rs`. |
| 1: the web view looked at by the Android part | the main thread | Kotlin that no agent can try: it runs only in the app. |
| The detailed part of each stage, written before it is built | the most capable model | It is the design: a builder is as good as what it is given. |
| 1: what a device takes, in the engine, and its tests | the most capable model, which also reads it once more before it is merged | Small, and a wrong rule here loses what the server keeps. |
| 2: the frame of the page, the notes, finding, the filter | Opus | Wide; what of `NoteList`, `NoteCard` and `page.svelte.ts` is used as it is and what is made anew is a judgement. |
| 2: a note: the editor, the row over the keyboard, name, tags, box, source | Opus | Wide, and in the editor. |
| 2: the settings of the phone, and *device* for *computer* | Sonnet | Small and said to the last word: a section that is there, made to fit, and its words changed. |
| 3: the kind `shared`, in the core's inbox and taken in by the page, with the tests of both | Sonnet | Small, said field by field, proven by its tests. |
| 3: *New note*, *Photograph*, *Picture or file*, arriving on the note after Share | Sonnet | Small, on the parts of stage 2. |
| 3: the Kotlin, the manifest, the door for a round when closed | the main thread | Some hundred lines that no agent can try: they run only in the app. |
| 4: the file, the key, the workflow | the main thread | A recipe is proven by running it, and the key is the owner's. |
| 4: the other seven languages | Sonnet, in a round | As for 0.2.14; every message with its comment. |
| The scripts `e2e/phone-*.mjs` | each agent for its part, not run | The main thread builds once and runs them. |
| The guide | each agent for its part | The main thread makes one chapter of them. |
| Every diff read, every merge, every build, the running app, the release | the main thread | |
| A diff of what can lose the writer's things (the engine, the stores, what is sent to or taken off the server), read before it is merged | the most capable model | A second reading that has not seen the builder's reasons. |

**The main thread need not be the most capable model** (the owner's question, 2026-11-23). It may be Opus: what it does itself in this table (the shell, the Kotlin, the recipes, reading diffs, merging, building, running the app) is building to what is written here. Whichever model it is, it gives each row to the model the row names, as an agent on that model, and so asks the most capable model for the three rows that name it. An agent begins with nothing but what it is told, so each of those is asked with this plan, the record of the trial and the files to read named, and for a reading before a merge with the diff and not with the builder's account of it. A main thread that finds itself deciding what the program does, where this plan does not say, stops and asks for that row's model instead of deciding.

About two thirds of what is written (the page, its words, its tests, its scripts, the translations) goes to Opus and Sonnet. That is a guess before stage 0. What stays is where a fault costs the writer's things or cannot be seen without the running app.

For every agent, from what was learned: the first step is to see that this plan is in `git log` of the worktree, else `git merge --ff-only <commit>`; what matters of `.claude/briefs/common.md` is quoted in its prompt, since the briefs are not in git; every step is committed and a note of progress kept; `pnpm check` and `pnpm test`, and where Rust changes `cargo fmt`, clippy and `cargo test -p glaukopis-core -p glaukopis` with the main thread's `target/`; never the application's binary, never a build for Android, never the emulator.

## Left for later

- **A thing collected without the app coming to the front.** Taking in is the page's work; it would have to be the core's.
- **A widget** on the home screen, **sound recorded**, **a code read by the camera** to join a home.
- **Fetching at regular times** with the app closed, and **a word from the system** when something arrives.
- **A choice of sending files only on Wi-Fi**, should the files prove heavy.
- **A wider page for tablets.**
- What the synchronization left for later holds here too: encryption on the devices, so that the server keeps what it cannot read.

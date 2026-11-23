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
- **The notebook's interface**: the model (`src/lib/notebook/model/`) knows nothing of the page. `NotebookView.svelte` (1059 lines) is three columns for a wide window. Of its parts a narrow page uses `TagsField`, `page.svelte.ts`, `page-view.svelte.ts`, `sources.ts` and `filters.ts` as they are. `NoteList` is for the mouse and the keys, `NoteEditor` and `SourceDialog` bring the application's tools of writing, its router, the form of a reference and the reading of text with them, and `NoteCard` is the card of the document pane: the phone has its own in their place (corrected when stage 2 was detailed).
- **The synchronization's section** (`src/lib/sync/SyncSettings.svelte`, 578 lines) with its commands (`sync_start`, `sync_join`, `sync_home`, `sync_code`, `sync_stop`, `sync_now`).
- **Mouse and finger**: the interface listens to the pointer in most places (88 uses in 46 files), to the mouse alone in 24 files, opens menus by the right button in 22, and acts on a double click in 25. The phone's page uses none of the last three as the only way to anything.
- **Tauri 2.12 with wry 0.57**: the web view of Android opens the camera for a field of files that asks for one (`RustWebChromeClient.onShowFileChooser`), and a plugin written in Kotlin is told of what other apps hand over (`Plugin.onNewIntent`).
- **This machine**: Android Studio, the platforms 36 and 37, NDK 29, the emulator with one system image (`android-36.1`), `adb`, KVM. Java is 27; the build uses the one Android Studio brings. No Rust targets for Android. 243 GB free; a build for one kind of processor is a whole build of the core.
- `/src-tauri/gen`, where Tauri puts the Android project, is ignored by git. Vite builds for `es2022` and `safari15`. The page has no history of places (`router.svelte.ts` replaces, never pushes).

## The shape

### The application in another role

- **The shell.** The sources of `src-tauri` are a second package, `src-phone`, built for Android alone and empty elsewhere, so that a build for a computer makes nothing for the phone (record 0121). The phone has a role of its own in `src-tauri/src/phone.rs`: one window labelled `phone`, the data folder in the app's own place (made and claimed as the application's is, `DataDir::open`: the phone's role is the only one at work in it), the engine, and only the commands the phone's page calls (the notebook's but for the sweep and the readable copy, the synchronization's, the languages, the settings, the log of the page, and the few of the files, the references and the server that a note and the settings show: listed in *Stage 2, in detail*). What is a desktop's alone stands behind `cfg(desktop)`: the single instance, windows made and placed, printing, the clipboard through GTK, the window of a note, Firefox. `lib.rs` is divided by role as this is done, not added to.
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
- **The settings.** Synchronization (the section there is, made to fit); the language; light or dark; the version. That a newer one is out is told from stage 4.
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
1. **The role, and what a phone takes. Done on 2026-11-23: record 0122.** The shell divided by role, `glaukopis --phone`; a web view too old said by the Android part; the engine told what a device takes, with its tests against the server. (The phone's data folder and the backup turned off were done in the trial.) Its detailed part is *Stage 1, in detail*, below.
2. **The notes shown, found and written; the synchronization set up. Done on 2026-11-23: record 0123.** The page of the phone. *Device* for *computer* in the words of the synchronization, on the computers too, with an addendum to its record. From here the owner has an app to use: a note written on the phone is on the computer. Its detailed part is *Stage 2, in detail*, below.
3. **Collecting.** Share, the selection's menu, the photograph, pictures and files, *New note* on the icon; sent when closed.
4. **Given out.** The signed file, the job of the workflow, the newer version told, the website's folder, the chapter of the guide, the other languages in a round.
5. **A trash for notes** (the owner's word, 2026-11-23): a note deleted on any device goes to a trash on every device and can be brought back from it; its files go when the trash is emptied, which also answers the files of deleted notes that a phone keeps today. For computers and phones alike; a plan of its own, after stage 3 or before it, as the owner says.
6. *Later, should the owner want it:* **text read on the phone.** Photographs measured first; then Tesseract brought along, the languages, *Read the text*; PDFs after.
7. *Later:* the rest of the notebook by finger: the surface of a box, Join and Divide, links.
8. *Later:* **maps shown.** The tree of projects from the home document; a project fetched when it is opened and kept from then on; read as text and as the diagram.
9. *Later:* **maps edited.**

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

### For stage 2, from the second reading of part A

Found by the reading, none of them a fault of stage 1; each is to be decided when stage 2 is detailed.

1. **A device whose notebook is refused** (a later form, too large, unreadable) still mirrors the library's records of the notes' files both ways, judged by the sweep against its stale notebook. A computer does so today. With a phone that sweeps, a picture could go off the server and come back at every start of the app, and the mark that a note holds a file could be taken off for a while, so that removing the file from the library on a computer deletes it from disk though a note holds it. Stage 2 decides whether a device whose notebook is refused sweeps at all, and whether it mirrors the records of the notes' files.
2. **The sweep's protection** (`kept_for_notes`) leans on `Notebook::held()`, which is written only when the page saves the whole notebook. The phone's page must save it so, or a sweep elsewhere is not told again.
3. **A home document in a later form ends a phone's whole round**, before its notebook, though a phone writes nothing into it. So notes written on an outdated phone stay there until the app is updated. Whether a phone should go on with its notebook then is the owner's to say.
4. **A file that stops being the notes'** stays on the phone, as decided above, and is not taken away; and a phone that leaves and joins again offers again the records of files it never held, which then show as missing. Nothing is lost by either.
5. **A lost `library/files.json`** is caught on a computer because its store holds files the record lacks. A phone whose notes hold no file has an empty store, and would tell every record as taken out. No path that loses the file alone is known; the guard is to be weighed. (Found when stage 2 was detailed: a lost `library.bib` or `collections.json` is caught nowhere, on a computer either, and reads as a library emptied. Stage 2 builds the guard for all three.)

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

## Stage 2, in detail

Written on 2026-11-23, after the code it touches was read. Where it says a file, a name or a shape, that is what is built. A builder who finds the code otherwise than it is said here stops and says so, and does not choose. Writing it corrected the plan above in five places: which parts of the notebook's interface a narrow page is made of; what the phone's commands are; that a newer version is told from stage 4 and not in the settings of this stage; the rows of this stage in *Who builds what*; and what the fifth finding of *For stage 2* says is caught.

Five parts.

| Part | Who | Where |
| --- | --- | --- |
| A. What the notes hold, kept: when a device sweeps, what is never taken from the notes, a file of the library lost; and what the engine tells the phone's page | the most capable model, as an agent in a worktree. Its diff is read once more by the most capable model, as a second agent that is given the diff and this section and not the builder's account, before it is merged | `crates/core/src/notebook.rs`, `crates/core/src/library/`, `crates/core/src/sync/`, `crates/server/tests/`, `src-tauri/src/commands/notebook.rs`, `src-tauri/src/state.rs`, one line each of `src-tauri/src/application.rs` and `src-tauri/src/contract.rs`, `src/lib/api/notebook.ts`, one field of `src/lib/api/sync.ts`, `src/lib/api/contract.generated.ts`, `src/lib/notebook/open.svelte.ts` |
| B. The phone's commands, Android's own, the meeting points, the running app | the main thread | `src-tauri/`, `src-phone/`, `crates/core/src/sync/mod.rs`, `crates/core/src/i18n.rs`, `src/main.ts`, the meeting points (the stylesheets `src/app.css` and `src/placing.css` among them), `e2e/phone-role.mjs`, `e2e/android/` |
| C. The page: its frame, the notes, finding, the filter | Opus, as an agent in a worktree | `src/lib/phone/` but for what is D's and E's, `src/lib/ui/` (`Button`, `TextField`, `Segmented`, `Dialog`), `src/lib/figures/pictures.svelte.ts`, `e2e/phone-notes.mjs` |
| D. A note | Opus, as an agent in a worktree | `src/lib/phone/`: `NoteView`, `ToolRow`, `tools.ts`, `BoxSheet`, `SourceSheet`; `src/lib/notebook/TagsField.svelte`; `e2e/phone-note.mjs` |
| E. The settings of the phone, and *device* for *computer* | Sonnet, as an agent in a worktree | `src/lib/phone/SettingsPlace.svelte`, `src/lib/sync/SyncSettings.svelte`, `src/lib/api/sync.ts` where `syncComputer` goes out, `locales/en/` and `locales/nb/`, `locales/GLOSSARY.md`, `docs/guide.md`, `e2e/phone-sync.mjs`, `e2e/synchronization.mjs` |

A writer at a computer sees one thing of this stage: the words of the synchronization say *device* where they said *computer*. Nothing else of the application changes to the eye. `contract.generated.ts` changes by one field (`waiting` of the status).

### Where the parts meet

Before any agent begins, the main thread makes one commit on main, **the meeting points**, and every agent starts from it. It holds, for each thing one part uses of another's, a file at its path with the shape said here and a body that does the least; the part that owns the path fills it in, and no other part touches it. It also holds the phone's own words (`phone.ftl`, in English and Bokmål: the section *Words*), which two parts use, and the test of what is shown under a pointer with the shared files brought to pass it.

| What | Where | Shape | Filled in by | Used by |
| --- | --- | --- | --- | --- |
| The places and their steps | `src/lib/phone/places.svelte.ts` | `type Place = { at: 'notes' } \| { at: 'note'; note: string; fresh?: boolean } \| { at: 'settings' }`; `places.current: Place` (read, reactive); `places.begin()`; `places.go(place)`; `places.back()`; `places.step(close: () => void): () => void` | C | C, D, E |
| A note | `src/lib/phone/NoteView.svelte` | props `{ notebook: Notebook; id: string; fresh?: boolean }`; its root has `data-phone-note={id}` | D | C |
| The settings | `src/lib/phone/SettingsPlace.svelte` | no props; its root has `data-phone-settings` | E | C |
| The row at the top of a place | `src/lib/phone/TopBar.svelte` | props `{ title?: string; back?: boolean; children?: Snippet }`, the snippet standing at its right end; `data-phone-bar`, and the button `data-phone-back`, which calls `places.back()` | C | C, D, E |
| A sheet from the bottom of the screen | `src/lib/phone/Sheet.svelte` | props `{ open: boolean; title?: string; onclose: () => void; children: Snippet }`; `data-phone-sheet` | C | C, D |
| The notebook of the window | `theNotebook` of `src/lib/notebook/open.svelte.ts` | two fields more, both `true` unless set before `open()`: `readable` (whether the readable copy is written) and `sweeps` (whether the sweep is asked for) | A | C sets both `false` |
| The status | `SyncStatus` of `src/lib/api/sync.ts` | `waiting?: boolean` in the meeting points; A makes it `waiting: boolean` with the Rust that sends it | A | C |
| The device's name, and the app in front | `src/lib/api/sync.ts` | `syncDevice = () => call<string>('sync_device')`; `syncFront = (front: boolean) => call<void>('sync_front', { front })` | the meeting points; the Rust is B's | E; C |
| The system's language as the page knows it | `languagesInfo` of `src/lib/api/system.ts` | `languagesInfo = (system?: string) => call<LanguagesInfo>('languages', { system: system ?? null })` | the meeting points; the Rust is B's | C |
| The ground behind the system's bars, and leaving the app | `window.glaukopisAndroid` | `ground(colour: string, dark: boolean): void`, `colour` as `#rrggbb`; `leave(): void`, the app put behind the others as the system's Back does where nothing listens, its process kept; there on Android only | B (Kotlin) | C |
| What lies over the window | `src/lib/ui/over.ts` | `export const over: { opened: ((close: () => void) => () => void) \| null } = { opened: null }` | the meeting points; `Dialog.svelte` is taught it by C | C |
| A picture tried again | `pictures.again()` of `src/lib/figures/pictures.svelte.ts` | `again(): Promise<void>`: what `#retry` does, to be asked from outside | C | C |
| The hooks of the scripts | `window.__glaukopisPhone` | by C: `box(name: string): string` (makes a box and gives its id), `note(made: { name?: string; words?: string; box?: string; tags?: string[] }): string` (makes a note through the model and gives its id), `remove(note: string): void` (deletes one through the model). By D, on the same object: `picture(name: string, content64: string): Promise<void>` (puts a picture into the note in view, as a paste does). Set through `testHook` of `shell/testing.ts`; D adds its function with `Object.assign` where the object is there | C, D | the scripts |
| What the scripts press and read | attributes | of C: `data-phone-notes` (the place), `data-phone-find`, `data-phone-filter`, `data-phone-to-settings`, `data-phone-new`, `data-phone-row={id}`, `data-phone-line`; of D: `data-phone-name`, `data-phone-text`, `data-phone-tool` (`bold`, `italic`, `list`, `todo`, `undo`), `data-phone-more`, `data-phone-box`; of E: those the section of the synchronization has (`data-sync-…`), and `data-phone-language`, `data-phone-theme` | each its own | the scripts |

What the three page parts hold to alike:

- **By finger.** Everything that is pressed is at least 44 pixels high and wide. `IconButton` is used in its usual size, never `sm`. Nothing is reached only by a long press, the right button, a double click or the pointer resting on a thing, and nothing of the three is built at all. A tooltip is not counted on: a finger never sees one.
- **Nothing is shown under a pointer but where there is one.** Every rule that says `:hover`, in every file the phone's page draws, stands inside `@media (hover: hover)`. `src/lib/phone/hover.test.ts`, made with the meeting points, reads the style of every `.svelte` file under `src/lib/phone/` and of the shared files it names, and fails on a `:hover` outside such a block. A part that comes to draw a shared file the test does not name adds it there in its own commit and makes it pass.
- **Nothing of the phone's own that holds words has a height written in pixels**: a least height, and the words decide the rest. Android makes the letters larger where the system is set so, and a row of a fixed height would cut them. The buttons and fields of `ui/` are let be: their one line of words has room in 44 pixels.
- **One column, from 320 pixels wide.** Nothing is scrolled sideways, and nothing lies outside the window at 320.
- **The words** are those of the notebook, the settings, the synchronization and the editor wherever one of them says it already (`notebook-new-note`, `notebook-search`, `common-delete`, `settings-theme`, …). The four that are the phone's own are in `phone.ftl`. C and D add no message and change none: one that is missing is asked of the main thread. E changes and adds those of its table, and no others.
- **What is not loaded.** The phone's page imports no component of the projects, the diagram, the typesetting, the library's pane or the application's settings window, and neither `router.svelte.ts`, `projects.svelte.ts` nor `changes.svelte.ts`: their commands are not the phone's.
- **For the scripts**, what a script presses or reads has an attribute: those of the table above by the names there, and any more a part needs, `data-phone-…`, named in the first comment of its script.

### A. What the notes hold, kept

Read before building: `crates/core/src/library/notebook.rs` (the sweep) and `mod.rs` (`load`, `load_files`, `remove_files`, `take_damaged`); `crates/core/src/notebook.rs` (`held`); `crates/core/src/sync/library.rs` (`Records`, `kept_for_notes`, `take_back`, `put_back`), `mirror.rs`, `engine.rs`, `files.rs`, `kept.rs`; `src-tauri/src/commands/notebook.rs` and `state.rs`; `src/lib/notebook/open.svelte.ts`, `model/notebook.svelte.ts` (`summary`, `applyFromWindow`) and `src/lib/project/model/saving.svelte.ts`; the five findings of *For stage 2*; the tests of `crates/server/tests/phone.rs` and `synchronized_library.rs`.

**What is at stake.** A file a note holds lies in the library's store, and its record says so (`only`, `also`). The sweep takes out what the notebook held alone and no note holds, and takes the mark off what the library has too. A sweep judged against less of the notebook than there is takes out the file of a note it does not know, and the home is told that the record went. A device whose notes hold the file keeps it and tells it again (`kept_for_notes`), by what its page last said the notes hold (`Notebook::held`). Two things were weak in that: when a device may sweep, and how true `held` is. And a mark taken off by mistake left the file open to be deleted: the library that removes a file with no mark deletes it, and a holder whose record lost the mark first deleted it too. A phone raises the stakes of all three: it starts many times a day, each start a first reading of the notebook beside a round under way, and the pictures taken on it are often on no other device yet.

**Decided.**

1. **A phone does not sweep.** A sweep on a phone, started many times a day, would be answered each time by a computer that holds the notebook without having it open: such a computer knows what its notes hold only as its page last said, keeps the file, and tells it again; the picture then goes off the server and comes back at every start of the app, over the phone's network. To stop that, the core would have to read from the notebook's bytes which files the notes hold, and that is a second reading of the notebook's document, which this plan does not make. So `notebook_sweep` is not among the phone's commands, and the phone's page does not ask for it (`theNotebook.sweeps`). What it costs: the files of notes that were deleted, or that a computer swept, stay on the phone, where they take room and are seen nowhere. Nothing is lost by it.
2. **A device whose notebook was refused does not sweep.** The engine keeps whether the last exchange of the notebook was refused (a later form, too large, not readable here: whatever makes `round` say `core-sync-problem-notebook`), in `sync/notebook-refused.json`. Where that was so when the run began, or is so when the sweep is asked for, nothing is swept in the run. Both are asked: a refusal that has just ended has brought the notes to the disk, and the page that asks may have read the notebook before they came.
3. **Such a device goes on mirroring the records of the notes' files**, both ways, as it does today. Leaving them out of the mirror would make it forget what it agreed on with the home, and it would tell all of them as its own once the refusal ended; that is the riskier change. What follows is borne: the records of notes it cannot read arrive, and on a phone their files with them; the records of files that its own unsent notes hold are told, and a computer that sweeps one of those is answered by the next rule.
4. **What the notes here hold is never taken from this device by what another device said.** In `Records::write`, by `held`: where a record is said to be gone and the notes here hold the file, the file is left to the notebook whatever its mark says (it is given the mark first, as `notebook_hold` gives it, and the library's own rule then keeps it), and it is told again. Where the mark alone is said to be gone and the notes here hold the file, the file is marked as one the notes hold beside the library (`also`), whatever its mark was here, and that is told again. (Corrected when part A was built and read. *As now* was not so: the round that kept a record found nothing changed at the next, and told it again only when something else changed in the library; now how the library's files lay is forgotten with a keep, and another round is asked for at once. And the mark stayed *as it is here*: but no mark in the home means that the library lists the file, as when a note went into a document elsewhere and was deleted there, and to tell `only` again took the picture out of the library's lists on every device, for the next sweep to delete.)
5. **What the notes hold is said when the notebook has been read, and when it changes**, and not only when the whole notebook is saved, so that `held` is true while a page has the notebook open: a phone's always, since its page is the notebook. That is the second finding, answered for every device. (Corrected when part A was read: it was to be said only when it changes, and what was read left unsaid. Then `held` stayed out of date from the reading until the list first changed, with notes that came from other devices while no page was open in no list, and notes deleted there still in it. What leaving it unsaid was for, that a page that read less than there is takes nothing a saved note holds, is the sweep's concern, and nothing is said before the sweep has answered; a page that read less saves its lesser list with the whole notebook when it closes in any case.)
6. **The page hears what a round writes while it reads the notebook.** It listens before it reads, and applies what it heard meanwhile once it has read. Until now a change the engine wrote between the reading and the listening was in no page until the next start; a phone reads its notebook at every start, with the first round under way.
7. **A file of the library that was not on the disk when the library was read is taken as lost, not as emptied**, where the device and its home had agreed on something of it. Until now a lost `library.bib`, `collections.json` or `files.json` read as an empty one, and the round told every reference, collection or record as taken out, on a computer as on a phone: a lost record of the files was caught only where the store held files it lacked, which a phone whose notes hold no file does not. Now it is damage, and the store meets its map as for the first time, where what the home says stands and nothing is taken out of either.

**What is built, file by file.**

- `crates/core/src/notebook.rs`: `Notebook::say_held(&self, files: &[String]) -> Result<()>` writes `notebook.json` with these files, how many notes and when it was saved staying as they were; where there is none yet, one is written with no notes counted. Under the same hold as `save_state`.
- `crates/core/src/library/mod.rs`: what was not on the disk when it was read is remembered beside what was damaged (`load` for `library.bib`, and the collections and the record of the files where they are read), and handed over once, as `take_damaged` hands over: to the engine, which takes both as soon as it is made and before every round, and acts on them on the disk at once (below). A library emptied by the writer must go on reading as emptied: the builder sees, with a test, that each of the three files is written when its last thing is taken out, and not removed.
- `crates/core/src/sync/library.rs`: rule 4, in `Records::write`.
- `crates/core/src/sync/engine.rs`:
  - `round` keeps `notebook-refused` (`Kept::note`, a `bool`): true where `notebook_round` gave an error that is not of the server, false where it gave none; left as it is where the round ended before or in it for the server's sake. It is written only where it is another than it was (`Round` remembers it).
  - Rule 7, in `heed_amiss`: a file not there when read, of `references`, `collections`, or `files` and `file-folders`, whose `sync/base/` holds names, is damaged, with the warning there is; and of every damaged store what was agreed on is forgotten on the disk, with how the library's files lay, so that the round that comes to the library reads it. It is done when the engine is made (`Sync::new`, before any thread runs or anything is asked of a server), before every round, and before the library is come to in one. (Corrected when part A was read. It was done in `library_round`, before it was worked out whether the round is quiet. But the library knows what it found in memory alone, and writes a file anew in the run that found it missing: a start whose rounds never came to the library, for want of a server or for a home document in a later form, left nothing to remember it by, and the next start told every record of that file as taken out.)
  - After a round that kept a record or a mark for the notes, another is asked for at once, which tells it again; and where a file was left to be tried again, the thread waits the half minute in front or not. It is not tried at once: what failed may fail every time.
  - `Status` gets `waiting: bool`: whether the notebook or the library here holds what the server was not sent, as far as the disk says without asking it. It is worked out when a round ends: where the round could not reach the server, by the two looks below; false where it ended in any other way; left as it is while a round is under way, so that the page's line does not go and come with every try. The two looks: the notebook's files lie otherwise than at its last exchange and the document here holds more than it held at the moment kept then (`sync.had`, compared by `whole::holds_more`, the mirror of `whole::holds`; the document is read only where the files lie otherwise); or the library's files lie otherwise than when it was last brought to be the same (`LibraryLies`), a library that holds nothing and was never exchanged counting as nothing. Of the projects it says nothing: the phone's page shows it, and a phone has none. (Corrected when part A was built. It said: something beyond what the server was last seen to have, by `whole::beyond`. But what was deleted is in what a document holds beyond a state vector always, so a notebook in which anything was ever deleted was said to wait whenever its files were written since the last exchange, as when its page saves the whole with nothing new in it while the server is not reached. All the document held at the moment kept at its last exchange the server holds: what it had then was sent, and what came was taken in. So it waits where it holds a change or a deletion made since that moment, and not otherwise.)
  - `Sync::front(&self, front: bool)`: whether the app is in front. Either way a round is made at once. While it is not in front the thread asks nothing at regular times: it waits without the half minute, and is woken as ever by what is written here, by `now` and by `end`. `Wake` gets the field, and how long the thread waits at the most is a function of its own beside it, tested beside the code. Each change is a line of the log (`tracing::info!`: not in front, and nothing asked at regular times; in front again). A computer never calls it and is always in front.
- `crates/core/src/sync/mod.rs`: `pub fn notebook_refused(data: &DataDir) -> bool`, what the engine kept; false where nothing is kept, as on a device in no home, whose `sync/` went when it left.
- `src-tauri/src/state.rs`: `AppState` gets `notebook_refused: bool`, read in `AppState::open`.
- `src-tauri/src/commands/notebook.rs`: `notebook_sweep` does nothing, and says so in the log, where the notebook was refused when the run began or is now; that is looked at under the library's hold, which the sweep then keeps, since a round says that the notebook was refused before it comes to the library. `notebook_say_held(state, files: Vec<String>) -> CommandResult<()>`, new, calls `say_held`; it is registered in `application.rs` (B registers it for the phone).
- `src/lib/api/notebook.ts`: `notebookSayHeld = (files: string[]) => call<void>('notebook_say_held', { files })`. `src/lib/api/sync.ts`: `waiting: boolean`.
- `src/lib/notebook/open.svelte.ts`, in `#read`, in this order: it listens (`onNotebookUpdate`), keeping what it hears; reads the notebook from the disk and loads it; applies what it heard, and from then on applies at once; asks for the sweep where `sweeps`; and, once the sweep has answered (the notebook is given to whoever asked for it without waiting for that), begins to say what the notes hold: at once what they hold as they were read, and from then on, a second after any change to the document, whoever made it, `summary().files` is worked out, and where it is another list than was last said or saved, `notebookSayHeld` is called with it. Nothing is said before the sweep has answered: it judges by what was said before as well, so that a page that read less than there is takes nothing a saved note holds. Where the sweep failed, it may be asked for again in the run, and what was read is not said: only another list than that. (What was read was at first never said: see the fifth decision.) The readable copy is written only where `readable`.

**What holds it.**

Beside the code:

- `notebook.rs`: what is said is read again by `held`; the count of the notes and the time stay.
- `library/notebook.rs` and `mod.rs`: a file not there when read is said once; a library emptied by the writer is not.
- `commands/notebook.rs` of the shell: in a folder whose `sync/` says the notebook was refused, `notebook_sweep` answers nought and a file the notebook holds alone, which no note holds, is still in the store; the same folder without that says one, and the file is gone.
- `sync/library.rs`, with the two devices its tests have, two tests of a file that the library has and a note holds. The mark: the second device sweeps with nothing held, which takes the mark off there; they meet; on the first, whose notes hold the file, the mark is as it was, and after they have met twice the second has it again. The record: the mark is taken off the first one's record by hand, as a sweep elsewhere could take it before this rule, and the second removes the file from its library; they meet; the file is on the first one's disk, held by the notes alone, and after they have met twice the second has its record again.
- `engine.rs`: how long the thread waits, in front and not.
- `open.test.ts`: a change heard while the notebook is read is in the notebook after; the sweep is not asked for where `sweeps` is false; nothing is said of what the notes hold before the sweep has answered; a picture put into a note is said within the second, and a second change that leaves the list as it was is not said again; no readable copy where `readable` is false.

Against the real server, in `crates/server/tests/phone.rs`, four more beside the eleven of stage 1, which stay as they are (the sixth sweeps on a phone by the core's own function, to hold what a round does with a record that left a phone; a phone asks for no sweep any more):

1. `a_file_a_phones_note_holds_is_kept_when_a_computer_sweeps_it_with_less_of_the_notebook`. A picture taken on the phone into a note; the phone says what its notes hold; both settle. The computer sweeps with nothing held (`notebook_sweep`), as one that read less of the notebook than there is. After the rounds of both, the phone holds the picture, the computer holds it again, byte for byte, and the server holds it.
2. `a_device_whose_notebook_is_not_taken_says_so_and_says_it_no_more_when_it_is`. A phone in a home, settled. The state of its notebook on the disk is made bytes that are no document, and a note's change written after it: the round gives one problem, and `notebook_refused` is true. The state put back as it was: after the next round it is false. And where a phone is older than the form of the notebook, as the second test of stage 1 makes it, it is true (the form of a notebook is never put back, so that a refusal ends is tried by the first half).
3. `a_phone_that_loses_the_record_of_its_files_tells_nothing_as_taken_out`. A computer with two references, a collection and a file of the library; a phone joins; both settle. The phone's `library.bib`, `collections.json` and `files.json` are deleted, its library read anew, and a picture taken into a note there before its round, so that the record of the files is on the disk again with one file in it. After the rounds of both, the computer holds its references, its collection and its file as before, byte for byte, and the phone has the references, the collection and the records again, and its picture.
4. `a_phone_says_that_what_was_written_waits_while_the_server_is_not_reached`. A phone in a home, settled; the server is not reached; a round: `offline`, and `waiting` false. A note written: after the next round, `waiting` true. The server reached again: after the round, `idle`, and `waiting` false.

And two more, of what the reading of part A found:

5. `a_picture_that_became_the_librarys_is_not_taken_out_of_its_lists_by_a_device_whose_notes_held_it_alone`. Two computers; a picture the notebook holds alone on both, each having said that its notes hold it. On the second it is put among the library's files, the notes are said to hold nothing, and the sweep leaves it to the library alone. The first, not running meanwhile, makes its rounds with what its notes held when it last said so. After the second's next sweep and the rounds of both, the picture is on both and on the server, and the library lists it.
6. `a_lost_file_of_the_library_is_remembered_through_a_start_that_never_reaches_the_server`. A phone's `library.bib`, `collections.json` and `files.json` are lost; the run that finds them lost never comes to the library in a round (a start whose round does not reach the server; a start that ends before any round; the library read anew while the application runs, with no server), and writes each file anew by a picture, a reference and a collection; a new start with the server back. Nothing is told as taken out: the computer and the server hold what they held, and the phone has it all again.

In `synchronized_library.rs`, one test: a computer that loses `library.bib` alone, and reads its library anew, takes no reference from the other, and has its own again after they meet.

The second reading goes through the seven rules against the diff, one by one, and through every place where a file leaves a disk or the server: that none was added, and that the two in `Records::write` and the sweep take less than they did, never more.

**Not of what can be lost, and built with it** because it is in the same files: `waiting`, `front`. The second reading may pass over them.

### B. The phone's commands, Android's own, and the running app

**Tried first, on the new emulator with the app as it is**, before anything is built on what it answers. Each is a few lines through the door of the web view; what is found is told, and the plan corrected where it is otherwise.

1. **Back and the page's history. Tried on 2026-11-23: the web view's history does not count.** Two steps made by `history.pushState` and Back pressed: the app left at once, and its process ended; Tauri's part for Android saw `canGoBack` false. So the page answers Back itself, through Tauri's event `back-button` (`onBackButtonPress` of `@tauri-apps/api/app`, which the default capability allows): with a listener in the page, Back pressed twice left the app in front both times, and the page heard each. Where the page is at its first place with nothing over it, it leaves the app by `window.glaukopisAndroid.leave()`. The page's history (`pushState`, `popstate`) is not used. *Corrected in `places.svelte.ts` below.*
2. **In front and not. Tried: it holds.** Home pressed: `document.visibilityState` is `hidden` and `visibilitychange` came; the app brought back: `visible`. Should the web view not say it, the Android part says it to the page, and C is told how before it begins.
3. **The size of the letters. Tried: they grow (17 to 22.1 pixels at 1.3); nothing is added.** With the system's letters at 1.3 (`settings put system font_scale 1.3`): whether the page's letters grow. Where they do not, `MainActivity.onWebViewCreate` sets `settings.textZoom` from `resources.configuration.fontScale`.

**The meeting points**, as the section before says: the files with their shapes, the words, and the test of `:hover` with the shared files brought to pass it. For that test: `src/lib/phone/hover.ts` gives the places where a style says `:hover` outside `@media (hover: hover)`; the test asks it of every `.svelte` under `src/lib/phone/`, and of `ui/Button.svelte`, `ui/IconButton.svelte`, `ui/Segmented.svelte`, `ui/TextField.svelte`, `ui/Toaster.svelte`, `ui/Dialog.svelte`, `ui/ConfirmHost.svelte`, `ui/EmptyState.svelte`, `ui/Spinner.svelte`, `notebook/TagsField.svelte`, `notebook/HeldFile.svelte`, `files/Thumb.svelte`, `sync/SyncSettings.svelte`, `src/app.css` and `src/placing.css`. The main thread puts each such rule of those files inside the block, as `IconButton.svelte` has it; where `:hover` is one of several selectors of a rule, the rule is parted in two. The scrollbar's (`::-webkit-scrollbar-thumb:hover`) is passed over by the test, by name. A computer sees no change: `e2e/note-window.mjs` holds it to having a pointer.

**The phone's role** (`src-tauri/src/phone.rs`), once A is merged.

- **The commands**, these and no others:
  - of the system: `system_info`, `languages`, `language_set`, `log_page`, `file_read`, `settings_load`, `settings_set`; `notices_take`; `clipboard_read`;
  - of the notebook: `notebook_load`, `notebook_append`, `notebook_save_state`, `notebook_take_image`, `notebook_file`, `notebook_hold`, `notebook_say_held`, `notebook_inbox_waiting`, `notebook_inbox_take`;
  - of the files a note shows: `file_path`, `file_small`;
  - of the references, for the line that says a source: `library_list`, `library_refresh`;
  - of the server, looked at before a home is started or joined: `sharing_server`;
  - of the synchronization: `sync_status`, `sync_device`, `sync_start`, `sync_join`, `sync_home`, `sync_code`, `sync_rename`, `sync_remove`, `sync_stop`, `sync_now`, `sync_front`.
- **Those that leave**: `fonts_list`, and the six of the window of a note. `NoteWindowState` is managed no more, and `commands/notewindow.rs` goes behind `cfg(desktop)` in `commands/mod.rs`.
- **Not the phone's**, and tried as refused by the script: `notebook_sweep` (rule 1 of part A), `notebook_readable_write` (nobody reads a copy in the app's own folder), `notebook_take_files` (stage 3), `notebook_to_library`, the commands of Firefox, of notes brought in, of the projects.
- **The inbox is taken in on the phone**, by the page, when it starts and when the app comes to the front (part C). What was sent from the page of a note in the trial and in stage 1 lies there and becomes notes. No thread looks at the inbox on a phone (`look_at_the_inbox` is the application's): nothing writes into it while the app runs until stage 3, which says how the page is told.
- A test in `phone.rs` holds the list: the names registered, read from the source of the file as the test of the capabilities reads its files, are these and no others.

**`sync_computer` becomes `sync_device`** (`commands/sync.rs`, `application.rs`, `phone.rs`), and `glaukopis_core::sync::computer` becomes `device`. On Android it gives what the system calls the model (`ro.product.model`, read with `libc::__system_property_get`, as the `sys-locale` crate reads the language there), since `gethostname` says `localhost` on every phone; nothing where the system says none. It is offered, and the writer may change it before it is sent anywhere.

**`sync_front(sync, front: bool)`**, new, in `commands/sync.rs`, calls `Sync::front`; registered for the phone alone.

**`languages(system: Option<String>)`** (`commands/system.rs`). The system's language is what `GLAUKOPIS_LANGUAGE` says, where it is set (the scripts); else what the page says, where it says one; else what the core finds. In the core that is a second function, `i18n::system_tag_as(said: Option<&str>) -> String`, and `system_tag()` is that with nothing said. A phone's page says `navigator.language`: the web view knows the language Android is set to, and the core reads it from a property of the system that an app is not everywhere let read. The application's page says nothing and is as it was.

**`src/main.ts`** mounts `$lib/phone/mount` (`mountPhone(target)`) where `isPhone()`, and the page of a note only where `isNoteWindow()`.

**Android's own** (`src-phone/gen/android/`).

- `MainActivity.onWebViewCreate`: the object `glaukopisAndroid` is given to the page (`addJavascriptInterface`), with two functions, `ground(colour, dark)` and `leave()` (`moveTaskToBack(true)`, on the thread of the interface), each marked `@JavascriptInterface`. On the thread of the interface it gives what holds the page (`android.R.id.content`, which `keepClear` pads) that colour as its ground, so that it stands behind the system's bars, and has the bars' signs dark on a light ground or light on a dark one (`WindowInsetsControllerCompat`). The page is the app's own, read from the app's file, and the function takes a colour and nothing else. Should the bars not follow on the emulator, the choice of light or dark is taken out of the phone's settings, which then follow the system alone, and the owner is told.
- Nothing of the manifest changes.

**The scripts of this part** are in *The scripts*: `e2e/phone-role.mjs`, made anew, and those of `e2e/android/`.

### C. The page: its frame, the notes, finding, the filter

Read before building: `src/lib/notebook/window/mount.ts` and `NoteWindow.svelte` (what the phone shows today, and how a page of its own starts); `src/App.svelte` from `begin` to `takeNotices` (the language, the look, the notices: the pattern, not the code); `src/lib/notebook/NotebookView.svelte`, `NoteList.svelte`, `page.svelte.ts`, `page-view.svelte.ts`, `arriving.svelte.ts`, `inbox.ts`, `sources.ts`; `src/lib/sync/sync.svelte.ts`; `src/lib/ui/Dialog.svelte`, `IconButton.svelte`.

**What is used as it is, and what is made anew.**

| Of the notebook's interface | On the phone | Why |
| --- | --- | --- |
| The model (`model/`), `open.svelte.ts`, `holder.ts`, `inbox.ts`, `taking.ts`, `sources.ts`, `filters.ts` | as they are | They know nothing of the page. |
| `page.svelte.ts` (`rowOf`, `dayOf`, `chipsOf`, `takenFrom`, `saveSource`, `givesAnything`, `boxName`, `boxInView`, `tagsInView`, `toggledTag`, `offeredTags`) and `page-view.svelte.ts` (the box in view and the tags that are on, kept on the device) | as they are | The logic of the page apart from its markup. |
| `TagsField.svelte` | as it is, made to take a finger and a phone's keyboard (part D) | It is a field and its chips. |
| `NoteList.svelte` | made anew: `NoteRows.svelte` | It selects by the mouse and the keys, is dragged from, and opens its menu by the right button; on a phone a row is pressed and its note opens, and a row says more. |
| `NoteEditor.svelte` | made anew: `NoteView.svelte` (part D) | It brings the tools of writing of the application, Divide, and what became of a note with its ways into the projects. |
| `SourceDialog.svelte` | made anew: `SourceSheet.svelte` (part D) | It brings the form of a new reference, the picker of the editor, the reading of text and the way into the library. |
| `arriving.svelte.ts` | made anew: `inbox.ts` of the phone | It says what arrived with a way through the application's router. |
| `NotebookView.svelte`, `BoxColumn.svelte`, `FilterPopover.svelte`, `NoteCard.svelte`, the surface | not used | Three columns for a wide window; the card is the document pane's. |

**`mount.ts`**: `mountPhone(target)`. Before anything is drawn (`starting.ts`, `begin()`):

1. `document.documentElement.dataset.phone = ''`, and `./phone.css` is imported: under `:root[data-phone]` it gives the measures of a finger (`--control-h: 44px`, and the variables below).
2. The settings (`settings.load()`) and the languages (`languagesInfo(navigator.language)`) together; then the words of the language of the interface (the one chosen in the settings, else `languages.interfaceDefault`), loaded before the page is drawn, as the application does it. Spelling is off in this page's copy of the settings, not written: the phone's keyboard has its own.
3. `files.loaded = true`, as the page of a note sets it: nothing lists the library's files here. The pictures are read from the library's store, as they are unless told otherwise.
4. `theNotebook.readable = false; theNotebook.sweeps = false`.
5. `places.begin()`.

Then `PhonePage` is mounted, and after it, none of it waited for: the notebook is opened (`theNotebook.open()`), the references read (`library.load()`), the status followed (`sync.follow()`), what the core has to tell taken (`noticesTake`, and again at `onNotices`, each a message that stays until it is dismissed), and what waits in the inbox taken in.

**`PhonePage.svelte`**, the frame: the place `places.current` names, and nothing else of it kept alive: `NotesPlace`, `NoteView` (keyed by the note, with `notebook` once it is read) or `SettingsPlace`; `Toaster` and `ConfirmHost`. It holds what must go on whatever place is shown:

- **The language**, as the effect of `App.svelte` has it: the tag chosen or the system's; `document.documentElement.lang`; `languageSet(tag)`, so that the core speaks it; the words loaded, and a failure said (`settings-language-error-load`).
- **The look**: `document.documentElement.dataset.theme = settings.theme`, kept as it changes (the system's until one is chosen; `own`, should a file say it, applied as the page of a note applies it), the words the stylesheet shows (`--words-picture-absent`, `--words-picture-caption`), and after each change `window.glaukopisAndroid?.ground(colour, dark)`, with the ground of the page as the browser works it out (`getComputedStyle` of the root, as `#rrggbb`) and whether the theme in effect is the dark one.
- **In front and not** (`visibilitychange`, and `pagehide` as leaving): leaving, the notebook's changes not yet written are written (`flush`), the settings (`settings.flush()`), then the whole notebook (`snapshot()`), then `syncFront(false)`. Android may end the app at any moment after: what is written must be on the disk before the engine is told. Coming back: `syncFront(true)`, what waits in the inbox taken in, and the pictures that were not here tried again.
- **What changes on disk** (`following.ts`, with `onChanged` of `api/changes.ts`, a tenth of a second after the last of a run): `library` has the references read again where they were read; `files` has the pictures that were not here tried again (`pictures.again()`). The other areas are passed over.
- **On a computer** the window is shown once the page is drawn (`getCurrentWindow().show()`, a refusal passed over: on Android there is nothing to show).

**`places.svelte.ts`**: the three places, and their steps. (Corrected after the first trial: Android's Back is not the web view's history; the page keeps its own steps and answers Back itself.)

- The steps are a list kept in the page: the places gone to, and over them what lies over a place. `begin()` makes the list hold the notes, and on Android listens to Tauri's event `back-button` (`onBackButtonPress`), which calls `back()`. `go(place)` adds a step; `back()` takes the last step away, and where there is none but the notes, it calls `window.glaukopisAndroid?.leave()`: on Android the app goes behind the others, and in `glaukopis --phone` nothing happens. The history of the web view is not used at all, and nothing has to wait for it: every change happens at once.
- **What lies over a place is a step too**: `step(close)` makes one, and gives back what the thing calls when it has closed. Back, with such a step on top, calls `close` and leaves the place as it is. A thing that closes by itself, by its own button, calls what it was given, and its step is taken out of the list wherever it stands. `Sheet.svelte` makes its step while it is open. `Dialog.svelte` is taught the same through `ui/over.ts`: where `over.opened` is set and the dialog can be dismissed, it tells it of its closing when it opens, and calls what it gets back when it closes; `places.begin()` sets `over.opened = places.step`. So the question before *Stop synchronizing* and the renaming of a device are closed by Back, on a phone, and a computer, where nobody listens, is as it was.
- `places.test.ts` holds it: go and back; Back at a sheet closes the sheet and the place stays; a sheet closed by itself leaves one step fewer; a sheet closed and a place gone to at once ends at that place, with Back leading to where one was; two sheets, one over the other; Back at the notes asks to leave, and changes nothing else.
- The place is not kept from one start to the next: the app starts at the notes.

**`NotesPlace.svelte`**, from the top:

- **The row**: the field that finds (`notebook-search`, with its × while something is written, `notebook-search-clear`), the filter's button (`notebook-filters`, shown as on while a box is in view or a tag is on), the settings' button (`settings-title`, which goes to the place).
- **The line** (`Line.svelte`, `line.ts`): there only where something waits or is wrong, by the status (`sync.status`): `sync-refused` where the state is `refused`; else `phone-waiting` where it is `offline` and `waiting`; else `phone-problem` where a problem is said and the state is not `offline`; else nothing, and so nothing where the device is in no home and nothing where the server is merely not reached. It is a button over the whole width, which goes to the settings, where the section of the synchronization says the rest. `line.ts` is the rule alone, with its test.
- **The notes** (`NoteRows.svelte`): `notebook.find(query, { box, tags })`, newest first, with the box in view and the tags that are on from `pageView`. Each row: the dot of a note not looked at (`notebook-unseen`); its name or how it begins (`rowOf`), else `notebook-empty-note`; under it the day, and its source in a line (`sourceLabel` of the first of `chipsOf`, where it holds anything taken in: *No source*, where that has none); under that its tags, in one line that is cut; at the right its first picture, small (`Thumb`). A row pressed goes to the note. Only the rows in view are drawn, as `NoteList` does it, and their one height is measured from a row that is drawn, not written as a number. `rows.ts` holds what a row says beyond `rowOf`, with its test.
- **Where there is nothing**: `notebook-empty` with its text, in an empty notebook; `notebook-nothing-found` where nothing is found; `notebook-unreadable` with what the reading said, where the notebook could not be read (a later form says `notebook-later`).
- ***New note*** (`notebook-new-note`), a round button at the foot, at the right, over the list: a note in the box in view, or where all notes are shown in the box that receives (`notebook.receiving`), with the tags that are on; between two `checkpoint()`s; then `places.go({ at: 'note', note, fresh: true })`.

**`FilterSheet.svelte`**, opened by the filter's button, from the bottom of the screen: under `notebook-boxes`, *All notes* (`notebook-all-notes`) and each box by its name (`boxName`), the one in view marked, pressed to be shown (`pageView.setBox`); under `notebook-tags`, each tag with how many notes have it, pressed on and off (`pageView.setTags(toggledTag(…))`); *Done* (`common-done`) at its foot. Of the computer's other filters (what a note holds, the days, where it came from, not looked at, used) none is here.

**`Sheet.svelte`**: over the place, from the bottom, as wide as the window and no higher than four fifths of it, what it holds scrolled within it; a dimmed ground over the rest, which closes it when pressed; its title at its head with × (`common-close`). A step of the history while it is open.

**`inbox.ts`**: where `notebookInboxWaiting()` says something waits, the notebook is opened first, then `notebookInboxTake()`, then `notesOfInbox(notebook, items)` and `notebook.flush()`: one taking at a time, as `arriving.svelte.ts` has it. Nothing is said: the notes stand at the top of the list, not looked at.

**Made to fit, in shared files** (the application as it was):

- `ui/Button.svelte`, `ui/TextField.svelte`, `ui/Segmented.svelte`: the heights of their sizes are read from variables that are, where nothing sets them, what the heights are today (`--control-h-sm`, `--control-h-lg`, `--segmented-h`, `--segmented-h-sm` beside `--control-h`). `phone.css` sets them: 44 pixels, the small ones 40.
- `ui/Dialog.svelte`: `over`, as said.
- `figures/pictures.svelte.ts`: `again()`.

**What it is checked by**: `pnpm check`, `pnpm test`; the tests named (`places.test.ts`, `line.test.ts`, `rows.test.ts`, `inbox.test.ts`, `hover.test.ts`, and `starting.test.ts` for the language chosen and the system's); `e2e/phone-notes.mjs`, written and not run. Its paragraphs for the guide, in the guide's voice, in `docs/plans/phone-guide/notes.md`.

### D. A note

Read before building: `src/lib/notebook/NoteEditor.svelte` and `SourceDialog.svelte` (what a note's view does on a computer: the pattern); `window/NoteWindow.svelte` (the row of tools that held under a phone's keyboard in the trial); `TagsField.svelte`; `page.svelte.ts` (the sources); `holder.ts`; `src/lib/editor/RichText.svelte` (its props) and `commands.ts` (`toggle`, `markActive`, `kindOf`, `setKind`, `insertFigure`); `src/lib/state/library.svelte.ts` (`search`, `sortEntries`).

**`NoteView.svelte`**, from the top:

- **The row** (`TopBar`, with Back): at its right end *More* (`phone-more`), which opens a sheet with *Redo* (`notebook-redo`, there to be pressed while there is something to redo) and *Delete* (`common-delete`).
- **What is scrolled**: the name, in one line (`notebook-name`; `notebook.setName` as it is written, as `NoteEditor` keeps the field); the tags (`TagsField`, each change between two `checkpoint()`s); the box, a button that says its name (`boxName`) and opens the sheet of the boxes; the text; under the text the sources of what the note holds (`notebook-sources`, the chips of `chipsOf`, each opening the sheet of its source), where it holds anything taken in.
- **The text**: `RichText` with `kind="body"`, the note's fragment, `placeholder={t('notebook-write')}`, and the holder of the notebook with citing off: `{ ...holderOfNotebook(notebook), cites: false }`, made once for a notebook. A note just made (`fresh`) takes the cursor at its end. The whole of what is left under the name takes the finger, not the lines written alone, as `NoteWindow.svelte` does it under a coarse pointer; here always.
- **The row of tools** (`ToolRow.svelte`), at the foot of the view and so over the keyboard, since the Android part makes the page as high as the keyboard leaves: *Bold*, *Italic*, *List*, *To do*, *Undo* (`editor-bold`, `editor-italic`, `editor-list`, `editor-todo`, `common-undo`), five buttons of 44 pixels with room left for the two of stage 3 (a picture, a photograph) before *Undo* at 320. Each keeps the cursor in the text and the keyboard up, by refusing the press its usual effect (`onmousedown` with `preventDefault`, which is what held in the trial), and acts on the editor as the row of `NoteWindow.svelte` does: `toggle('strong')`, `toggle('em')`, the kind of the paragraph set to `item` or `todo`, or back to `text` where it is that already. A mark or a kind that is on shows so. The first four are there to be pressed only while the text has the cursor; *Undo* (`notebook.undo()`) while there is something to undo. `tools.ts` holds the commands and what is on, with its test.
- **Looked at**: a note shown is looked at (`notebook.lookedAt`).
- **Gone**: where the note is there no more, deleted here or on another device, the view goes back.

***Delete***: between two `checkpoint()`s, `notebook.deleteNotes([id])`; back to the notes; and the line that says it (`notebook-deleted` with one), for seven seconds, with *Undo*, which is `notebook.undo()`.

**The sheet of the boxes** (`BoxSheet.svelte`, titled `notebook-move-to`): each box, the note's own marked; pressed, the note is moved there (`notebook.moveToBox`, between two `checkpoint()`s) and the sheet closes. At its foot a field (`notebook-box-name`) with *New box* (`notebook-box-new`): `notebook.addBox(name)`, and the note moved into it. Boxes are not renamed, put in order or deleted here.

**`SourceSheet.svelte`**, props `{ notebook: Notebook; note: string; source: Source | null; onclose: () => void }`, as `SourceDialog` takes them. It does what the window of a source does on a computer, with three things left out: *Make a reference*, *Read the text*, and the way into the library.

- What it is (`Segmented`: `notebook-source-web`, `notebook-source-reference`, `notebook-source-other`), and its fields: a page's address and title; words; for a reference, a field that finds (`common-search`) over the references of the library, each a row of its authors and year over its title, sixty at the most (`search` and `sortEntries` of `state/library.svelte.ts`), pressed to be chosen, and its place (`LOCATOR_LABELS` and the field, as on a computer). A file says what it says of itself, and is not changed.
- *Apply* (`common-apply`) saves by `saveSource`, in one step of undo, as on a computer, and closes.
- The passages taken from it in the note (`notebook-source-passages`), each as it reads now, with *My own words*, and *Bring back* where it was changed, each a step of undo of its own.

**`TagsField.svelte`**, the application's as it was but for: a comma typed adds the tag also where the keyboard says no key (the field's `input` is looked at, since a phone's keyboard composes and sends no comma as a key); and under a coarse pointer the × of a chip, and each tag offered, is 44 pixels to the finger. Its own test goes on passing and gets the comma.

**The hook** `picture(name, content64)`: the picture is taken in through the holder (`pictureFromBlob`) and put where the cursor is, or at the end (`insertFigure`). Stage 3 puts *Photograph* and *Picture or file* on the same function.

**What it is checked by**: `pnpm check`, `pnpm test`; `tools.test.ts`; `NoteView.svelte.test.ts` (the name written is the note's; a tag added and taken away; the box changed, and a new box; *Delete* and *Undo*; a note gone goes back; *Redo* after *Undo*); `SourceSheet.svelte.test.ts` (a page given to what had no source; a reference chosen with its place; *My own words* takes the chip away); `TagsField.svelte.test.ts`; `e2e/phone-note.mjs`, written and not run. Its paragraphs for the guide in `docs/plans/phone-guide/note.md`.

### E. The settings of the phone, and *device* for *computer*

Read before building: `src/lib/sync/SyncSettings.svelte`, `sync.svelte.ts` and `src/lib/api/sync.ts`; `src/lib/settings/SettingsView.svelte`, where it sets the language and the colours (the pattern); `locales/en/` and `locales/nb/`: `sync.ftl`, `core-sync.ftl`, `core-sharing.ftl` where it speaks of a home; the chapter *Your computers, the same* of `docs/guide.md`; `e2e/synchronization.mjs`.

**`SettingsPlace.svelte`**: the row at the top (`TopBar`, titled `settings-title`, with Back), and under it, one under another, each under its heading:

1. **Synchronization**: `<SyncSettings takes="notes" />`.
2. **Language** (`settings-language`): the system's own choosing of one of a list (`<select>`): first *As the system*, with the name of the language that is (`settings-language-system`, of `languages.interfaceDefault`), then each language of `languages.interface` by its own name, in the order the application's settings have them. Chosen, it is kept (`settings.set('language', …)`, `system` for the first); the frame speaks it.
3. **Colours** (`settings-theme`): three to choose among (`Segmented`): `settings-theme-system`, `settings-theme-light`, `settings-theme-dark`; kept by `settings.set('theme', …)`. Not *Mellow* and not *Your own*: where the file says one of those, none of the three is shown as chosen.
4. **About** (`settings-about`): *Glaukopis* and the version (`systemInfo()`), and under it `settings-licence`. That a newer version is out is told from stage 4.

**`SyncSettings.svelte`**, the one section for a computer and a phone:

- A prop, `takes: 'everything' | 'notes' = 'everything'`, as the engine names what a device takes. The application's settings give none.
- `syncDevice()` where it called `syncComputer()`, which goes out of `api/sync.ts`.
- Where `takes` is `notes`: the sentence under the heading is `sync-about-notes`; and the question before *Stop synchronizing*, where this is the only device, is `sync-stop-message-alone-notes`. That is what the first test of stage 1 shows: a phone that leaves last takes off the server the projects and the files of the library, which it never held. It is said, not forbidden. Where the server could not be asked which devices there are, the question is the usual one, as on a computer.
- **Made to fit**: the fields one under another where the section is narrower than 520 pixels; the name of a device over its buttons there; the code in letters that stand within 320; nothing with a width of its own in pixels. The field of the server asks the keyboard for an address (`inputmode="url"`), with no capital letter, no correction and nothing remembered; the code for capitals, with no correction; the name with nothing remembered.
- Its own test, new (`SyncSettings.svelte.test.ts`, with `api/sync.ts` stood in for): the name the system gives is offered; with `takes="notes"` the sentence is the phone's, and the question of the last device the phone's; without it both are the computer's.

**The words.** Every message of the table in *Words*, in English and Bokmål, as written there. The other languages are not touched: they say *computer* until the round of stage 4, which is true where they are read today. The names of the messages stay (`sync-computer-name`, `sync-computers`, `core-sharing-many-computers`, …), and so do the hooks of the page (`data-sync-computer`): a new name would have to be given in thirty languages for no word that is seen. `sync-about` goes on saying *computers*: it says what is the same on each, and that is true of computers alone; a phone has its own sentence. `locales/GLOSSARY.md` gets *device*, under *The interface*: one of a writer's computers or phones that are synchronized; never *computer* in the words of the synchronization, since a phone is one; Bokmål *enhet*. (Bokmål has no glossary of its own: it is written with the English.)

**The guide.** In *Your computers, the same*, the words quoted from the interface are made what they now are (**Add a device…**, **Stop synchronizing on this device**, the devices listed in the settings, **“Name” was written in on two devices while they were apart.**), and one sentence is added where the chapter begins: a phone is one of the devices, and what it holds is told in its own chapter. The chapter is otherwise left as it is: it speaks to a writer at a computer, and the phone's chapter is stage 4's. E's paragraphs for that chapter, of the settings and of setting up the synchronization on a phone, in `docs/plans/phone-guide/settings.md`.

**The script of two computers** (`e2e/synchronization.mjs`) reads four of the changed sentences: they are made what they now are, and nothing else of it is changed.

**The addendum to record 0120**, written by the main thread when the stage ends, says:

- The words of the synchronization say *device* (Bokmål *enhet*), on the computers as on a phone (the owner's word, 2026-11-22): a phone is one of the writer's devices (0122). The one sentence that says what is the same on each goes on saying *computers*. The names of the messages and the hooks of the page are as they were. `sync_computer` is `sync_device`, and on Android gives the phone's model.
- A device whose notebook was refused at its last exchange sweeps out no file until a run that begins after it was taken again. A phone sweeps none at all.
- What the notes of a device hold is never taken from it by what another device said, whatever the mark of its record says, and is told again.
- What the notes hold is said when it changes, and the page listens for what a round writes before it reads the notebook.
- A file of the library that was not on the disk when it was read, where the device and its home had agreed on something of it, is taken as lost and not as emptied.
- The status says whether what was written here waits for a server that is not reached; a device that is not in front asks nothing at regular times.

**What it is checked by**: `pnpm check`, `pnpm test`, `node scripts/check-locales.mjs nb`; `SettingsPlace.svelte.test.ts` (a language chosen is kept, and *As the system* is `system`; dark chosen is kept; the version is shown); `e2e/phone-sync.mjs`, written and not run. No Rust is built by E: the words of the core are held by the core's own tests, which the main thread runs when E is merged.

### Words

**The phone's own**, new, in `locales/en/phone.ftl` and `locales/nb/phone.ftl`, made with the meeting points. Each with a comment over it in the file, as here.

| Name | English | Bokmål |
| --- | --- | --- |
| `phone-back` (the arrow at the head of a note and of the settings) | Back | Tilbake |
| `phone-more` (the button at the head of a note that opens what more can be done with it) | More | Mer |
| `phone-waiting` (the line over the notes: what was written here has not reached the server, which cannot be reached now) | Kept here, and sent when the server is reached | Tatt vare på her, og sendes når serveren kan nås |
| `phone-problem` (the line over the notes: the synchronization says something is wrong; pressed, it opens the settings, which say what) | Something is wrong with the synchronization | Noe er galt med synkroniseringen |

**New in `sync.ftl`** (E):

| Name | English | Bokmål |
| --- | --- | --- |
| `sync-about-notes` (under the heading, on a device that takes the notes: a phone) | Your notebook, the same on this device as on your others, through a server. The references of your library come with it, without their files. | Notatblokken din, den samme på denne enheten som på de andre enhetene dine, gjennom en server. Referansene i biblioteket følger med, uten filene sine. |
| `sync-stop-message-alone-notes` (the question before the last device stops, where it is one that takes the notes) | What is on this device stays here as it is. It is the only device that is synchronized, so nothing is left on the server. Your projects and the files of your library are not on this device: what the server keeps of them is deleted. | Det som er på denne enheten, blir her som det er. Den er den eneste enheten som synkroniseres, så ingenting blir igjen på serveren. Prosjektene dine og filene i biblioteket er ikke på denne enheten: det serveren har av dem, blir slettet. |

***Device* for *computer*, in `sync.ftl`** (E). The comments of the two files are brought along (*devices* for *computers*, *enheter* for *datamaskiner*). `sync-about`, `sync-remove-message` and `sync-offline` stay as they are.

| Name | English | Bokmål |
| --- | --- | --- |
| `sync-computer-name` | Name of this device | Navn på denne enheten |
| `sync-how` | How this device begins | Hvordan denne enheten begynner |
| `sync-refused` | Synchronization has stopped on this device | Synkroniseringen har stoppet på denne enheten |
| `sync-computers` | Devices | Enheter |
| `sync-this-computer` | { $name } (this device) | { $name } (denne enheten) |
| `sync-computers-unread` | The server could not be asked which devices there are. | Serveren kunne ikke spørres om hvilke enheter som er med. |
| `sync-add` | Add a device… | Legg til en enhet … |
| `sync-code-hint` | Enter the code on the other device, with { $join } under Synchronization in its settings. It can be used once, until { $until }. | Skriv inn koden på den andre enheten, med { $join } under Synkronisering i innstillingene der. Den kan brukes én gang, til klokken { $until }. |
| `sync-rename-title` | Rename the device | Gi enheten nytt navn |
| `sync-stop` | Stop synchronizing on this device | Slutt å synkronisere på denne enheten |
| `sync-stop-title` | Stop synchronizing on this device? | Slutte å synkronisere på denne enheten? |
| `sync-stop-message` | What is on this device stays here as it is. What is written on your other devices no longer comes here, and what is written here no longer goes to them. | Det som er på denne enheten, blir her som det er. Det som skrives på de andre enhetene dine, kommer ikke lenger hit, og det som skrives her, går ikke lenger til dem. |
| `sync-stop-message-alone` | What is on this device stays here as it is. It is the only device that is synchronized, so nothing is left on the server. | Det som er på denne enheten, blir her som det er. Den er den eneste enheten som synkroniseres, så ingenting blir igjen på serveren. |
| `sync-apart` | “{ $name }” was written in on two devices while they were apart. | «{ $name }» ble skrevet i på to enheter mens de var uten forbindelse med hverandre. |
| `sync-apart-moment` | the devices met | enhetene møttes |

**In `core-sync.ftl`** (E), with its comments:

| Name | English | Bokmål |
| --- | --- | --- |
| `core-sync-refused` | The server no longer lets this device in. It was removed from those that are synchronized, or nothing of them is kept on the server any more. | Tjeneren slipper ikke lenger inn denne enheten. Den ble tatt ut av dem som synkroniseres, eller ingenting av dem er lenger lagret på tjeneren. |
| `core-sync-later-home` | Another of your devices has a later version of Glaukopis, which keeps what is synchronized in a form this version does not know. Update Glaukopis here. | En annen av enhetene dine har en nyere versjon av Glaukopis, som lagrer det som synkroniseres, i en form denne versjonen ikke kjenner. Oppdater Glaukopis her. |
| `core-sync-later-library` | Another of your devices has a later version of Glaukopis, which keeps the library in a form this version does not know. Update Glaukopis here. | En annen av enhetene dine har en nyere versjon av Glaukopis, som lagrer biblioteket i en form denne versjonen ikke kjenner. Oppdater Glaukopis her. |
| `core-sync-not-on` | This device is not synchronized. | Denne enheten synkroniseres ikke. |
| `core-sync-already` | This device is synchronized already. | Denne enheten synkroniseres allerede. |
| `core-sync-needs-name` | Give this device a name. | Gi denne enheten et navn. |
| `core-sync-remove-self` | This device is taken out by stopping the synchronization here. | Denne enheten tas ut ved å stoppe synkroniseringen her. |
| `core-sync-file-too-large` | “{ $name }” is larger than the server takes ({ $most } MB at the most), and is not on your other devices. | «{ $name }» er større enn tjeneren tar imot (høyst { $most } MB), og finnes ikke på de andre enhetene dine. |

**In `core-sharing.ftl`**, what the server refuses of a home (E), with the comment over them. `core-sharing-own-code` is of sharing a project and stays.

| Name | English | Bokmål |
| --- | --- | --- |
| `core-sharing-no-home` | The server no longer keeps what these devices synchronize. | Serveren har ikke lenger det disse enhetene synkroniserer. |
| `core-sharing-later` | Something was written on another device by a later version of Glaukopis. Bring this one up to date to synchronize it. | Noe ble skrevet på en annen enhet med en nyere versjon av Glaukopis. Oppdater denne for å synkronisere det. |
| `core-sharing-home-not-admitted` | The server no longer lets this device in: it may have been removed from those that are synchronized. | Serveren slipper ikke lenger inn denne enheten: den kan være fjernet fra dem som synkroniseres. |
| `core-sharing-home-full` | The server synchronizes the devices of as many writers as it is set to. | Serveren synkroniserer enhetene til så mange skribenter som den er satt opp til. |
| `core-sharing-many-computers` | Sixteen devices are synchronized already, which is the most; remove one first. | Seksten enheter synkroniseres allerede, og det er det meste; fjern én først. |
| `core-sharing-no-computer` | There is no such device among those that are synchronized. | Det finnes ingen slik enhet blant dem som synkroniseres. |
| `core-sharing-no-computer-name` | The device has no name. | Enheten har ikke noe navn. |
| `core-sharing-many-documents` | The server keeps as many documents for these devices as it may. | Serveren har så mange dokumenter for disse enhetene som den kan ha. |

**Elsewhere**, the four that a phone's page can show (E). Every other message that says *computer* is of the projects, the typesetting, the fonts or Zotero, which a phone does not have, and stays.

| File and name | English | Bokmål |
| --- | --- | --- |
| `notebook.ftl`: `notebook-file-not-here` | The file is not on this device | Filen er ikke på denne enheten |
| `figures.ftl`: `figures-picture-absent` | The image is not on this device | Bildet finnes ikke på denne enheten |
| `core.ftl`: `network-tls` | a secure connection to { $host } could not be made: its certificate may not be trusted on this device, or something between them, such as a proxy or a firewall, is in the way | fikk ikke en sikker forbindelse til { $host }: enheten stoler kanskje ikke på sertifikatet, eller noe imellom, som en proxy eller en brannmur, står i veien |
| `settings.ftl`: `settings-set-aside-person` | The settings could not be read, and are set aside as { $path }; the defaults are used, and this device is a new person in the history of projects | Innstillingene kunne ikke leses, og er lagt til side som { $path }; standardinnstillingene brukes, og denne enheten er en ny person i historikken til prosjektene |

**No string of Android's** is added or changed. What the engine logs, and what `glaukopis --phone` says on the standard error, is in English as the log is.

### The scripts

**Through `glaukopis --phone`, with the harness that is there** (`App.launch({ args: ['--phone'], width: 412, height: 915 })`). Each is written by its part and run by the main thread; its first comment says what it covers, and its screenshots are `e2e/output/phone-<script>-<n>-<what>.png`. The three of the page end by being started once more at 320 by 568, where each place is shown and nothing lies outside the window (`document.documentElement.scrollWidth` no more than the window's width, and every button of the rows within it).

1. **`e2e/phone-role.mjs`** (B, in place of the one of stage 1). Before the role is started, a thing is put into `notebook/inbox/` of its folder as the page of a note left one (the kind `note`, with its words and no document, so that the words are the note's lines; named and laid out as `crates/core/src/notebook/inbox.rs` says). The role starts: one window, labelled `phone`, no wider than 420, showing the notes; the thing from the inbox is a note in the list, not looked at, and the inbox is empty. `project_list`, `fonts_list`, `note_window_send`, `notebook_sweep` and `notebook_readable_write` are refused; `sync_status` says off; `sync_device` gives a name. No errors in the page.
2. **`e2e/phone-notes.mjs`** (C). The empty notebook says so. *New note*: the note is shown, with the cursor in its text; words written; Back (the button): the row says how it begins and the day. By the hook: a box, and three notes more, one with a name, one in the box, one with a tag. The rows say each: the name, how it begins, the day, the tag. Found by a word, and the × shows all again. The filter: its button opens the sheet from the bottom; the box chosen shows its note alone and the button says it is on; a tag on; *All notes* again. The history: with the sheet open, `history.back()` closes the sheet and the notes stay; from a note it goes to the notes; a sheet closed by *Done* and a note opened at once ends in the note, and one step back is the notes. The settings' button goes to the settings, and Back comes back. The line: nothing while the device is in no home. The words of the page in Bokmål, with the language set in the phone's `settings.json` before a second start. Light and dark the same way: `data-theme` on the root.
3. **`e2e/phone-note.mjs`** (D). A note opened from the list. Its name written, and the row of the list has it. Words written; *Bold* pressed, words, *Bold* again: the middle words are bold and the cursor stayed in the text; *List*, two points; *To do*, and the point ticked by a press on its box; *Undo* takes the last away. A tag added by Enter and by a comma, and taken away by its ×. The box: the sheet, *New box*, and the note is in it. A picture, by the hook: it stands in the note, and the row of the list shows it small. Words pasted from outside Glaukopis: the chip *No source*; the sheet of the source; a page given, the chip says its title; *My own words* takes the chip away. *More*, *Delete*: the notes, without it, and the line with *Undo*, which brings it back; *More*, *Redo* after an undo. A note deleted while it is shown (by the hook): the view goes back.
4. **`e2e/phone-sync.mjs`** (E). With the real server, and the application as a computer beside the phone, each in a folder of the run, as `e2e/synchronization.mjs` makes its two. The computer holds a project, a reference with a file, a file of the library alone, and a note; it starts a home and makes a code. On the phone: the settings, *Join with a code*, the server, the name the system offers changed to *Phone*, the code, *Join*; the devices are listed, the phone as this device. **A note written on the phone is on the computer**: its words in the computer's notebook, and a picture put into it by the hook in the computer's store, byte for byte. **A note written on the computer is on the phone**: in the list without a new start. The phone's folder holds the reference (`library/library.bib`), no project, no file of the library, and not the computer's setting, as the script of stage 1 looked. *Add a device…* on the phone shows a code. A device renamed. The line: the server ended, a note written on the phone: `phone-waiting`; the server started again on the same folder and port, and a round made (*Synchronize now*, in the settings): the line is gone and the note is on the computer. Not in front (the page's `visibilityState` made `hidden` by the script, and the event sent): the log of the phone's run says that it asks nothing at regular times; in front again (the same, with `visible`): it says so, and a round is made. The computer stops synchronizing; then on the phone *Stop synchronizing on this device*: the question says the phone's words for the last device; confirmed, the section says that the device is not synchronized, and the server keeps nothing of the home.

**The application's own scripts**, run once what they cover is merged: `e2e/synchronization.mjs` (two computers as before, in the new words), `e2e/note-window.mjs` (the page's entry, the shared buttons, a computer has a pointer), `e2e/notebook.mjs` (the notebook read and written as before, in two windows, with its tags and its files), `e2e/settings.mjs` (the buttons and fields whose heights are read from variables now), `e2e/languages.mjs` (no English left in Bokmål).

**On the emulator** (`e2e/android/`, all B's, the new device unless said; one emulator at a time, and never beside another capped unit):

1. **`typing.mjs` and `marks.mjs`**, brought to the phone's page: they begin with *New note* and write in the note; the marks through the row of tools.
2. **`page.mjs`**, new. The app started: the notes. *New note*, words typed on Google's keyboard; whether the keyboard comes up by itself in a new note is looked at and written down (where it does not, a tap brings it, and it is left so). Back (`input keyevent 4`): once puts the keyboard away, once more is the notes, with the note's row; a sheet open, Back closes it and nothing else; at the notes, Back leaves the app. Home, and the app again: the page said it was not in front and that it was again; the engine rested between (its log). The app ended from outside and started: the note is there. Dark chosen in the settings: the top row of pixels of a screenshot is the page's ground, and so is the row at the foot. The system's letters at 1.3: a screenshot of the notes and of a note, looked at: nothing cut. The emulator set to Norwegian: the page is in Bokmål.
3. **`sync.mjs`**, new. The server on this machine, reached from the emulator as `10.0.2.2`, and the application as a computer under the harness. The computer starts a home and makes a code; on the emulator, in the settings, the server, the name and the code are written and *Join* pressed. A note typed on the emulator is in the computer's notebook; a note written on the computer is in the emulator's list. The name offered was the model the emulator says.
4. **`web-view.mjs`** once more: the app starts as it did.

**By the owner's hand**, on the owner's phone, with the app built for it as in the trial: joining the home of the owner's computer with a code; a note written under Samsung's keyboard, with its suggestions, bold and a list from the row; that it is on the computer, and one from the computer on the phone; the list found in and filtered; Back, by the gesture; dark, and the bars; the line, with the network off; the size of the letters, where the phone has them large.

### The order of the work, and what each step is checked by

Edits first, then `cargo fmt --all` and `pnpm format`. Every step is committed when its checks pass.

1. **B: the three trials on the emulator**, with the app as it is. What was found is told, and this section corrected where it is otherwise, before any agent begins.
2. **B: the meeting points**, one commit on main: the files of the table with their shapes, `phone.ftl` in English and Bokmål, `over.ts`, the test of `:hover` with the shared files brought to pass it, and `docs/plans/phone-guide/` with its three empty files. Checked by `pnpm check` and `pnpm test`; `e2e/note-window.mjs` is run at step 7.
3. **A, C, D and E begin**, each in a worktree of its own from that commit. A alone builds Rust meanwhile, in the main thread's `target/`: `cargo test -p glaukopis-core -p glaukopis-server -p glaukopis`, `cargo clippy --workspace --all-targets -- -D warnings`, `pnpm check` (the contract, with `waiting`), `pnpm test`. C, D and E run `pnpm check` and `pnpm test`, and E `node scripts/check-locales.mjs nb`; none of them builds Rust, the application or anything for Android.
4. **A is read once more**, by the second agent, which builds nothing. **A is merged** when the reading found nothing, or what it found is mended and read. The main thread runs the three packages' tests on what was merged.
5. **B: the phone's role**, on what was merged: the commands, `sync_device`, `sync_front`, `languages` with what the page says, the window of a note's commands behind the desktop, `src/main.ts`. Checked by `cargo test -p glaukopis-core -p glaukopis`, both clippies (for computers, and `. packaging/android/env.sh && cargo clippy -p glaukopis-phone -p glaukopis-core --no-default-features --target aarch64-linux-android -- -D warnings`), `pnpm check`, `pnpm test`.
6. **C, then D and E, are merged**, each when the main thread has read its diff; after each, `pnpm check` and `pnpm test`, and after E `cargo test -p glaukopis-core` for the words of the core.
7. **The running page**: `pnpm e2e:build`, the server built (`cargo build -p glaukopis-server`), then the four scripts of the phone, and the five of the application. What a script finds is mended by the main thread where it is building to this section, and given back to the part's model where it is not.
8. **B: Android's own**: the ground behind the bars, and the letters where the trial asked for it; the app built for trying in a capped unit; the scripts of `e2e/android/`; clippy for Android once more.
9. **The end of the stage**, by the main thread: the record of it (`docs/adr/0123`, with its line in `docs/adr/README.md`): the page of the phone, its history and its places, what was made anew and why, what a phone does not sweep, and what was tried; the addendum to 0120 and its line in the index; the map in `CLAUDE.md` (`src/lib/phone/`, the phone's commands, `e2e/phone-*.mjs`); this plan: the stage marked done, and corrected by what was found. The app is built for the owner's phone as in the trial, with the list of what to try. The owner is told what was chosen here.

Nine scripts of the computer's harness, two to three minutes each, three of them run twice (at 412 and at 320, within the script); five runs on the emulator.

### Left out of stage 2

So that no builder adds it.

- **Collecting**: Share, the selection's menu, *Photograph*, *Picture or file*, *New note* on the icon, the kind `shared`, `notebook_take_files`, a round with the app closed, and how the page is told of what comes into the inbox while it runs: stage 3. A picture comes into a note in this stage by a paste, and by the hook of the scripts.
- **A sweep on a phone**, and the core reading from the notebook's bytes which files the notes hold. The files of deleted notes stay on a phone.
- **A newer version told**, the signed file, the chapter of the guide, the seven other languages (which say *computer* until then): stage 4.
- **The names** of the messages and of the page's hooks that say *computer*. The comments of the code: one that this stage makes untrue is mended where the stage touches the file, and no other.
- **In a note**: Join and Divide, links, the ways into a text, starting texts, citing, a box of rich text made (one that came from a computer is shown and written in), the highlight, a numbered list, the kinds of paragraph beyond a list and *To do*; a file a note holds opened; *Make a reference*; *Read the text*; what became of a note.
- **Of the notebook**: the surface; boxes renamed, put in order or deleted; tags renamed or taken off every note; the other filters; several notes chosen at once; import; the readable copy.
- **By finger**: anything opened by a long press, a swipe, or a pull.
- **The place kept** from one start to the next. **A wider page** for tablets.
- **What the page of a note kept unsent** on a phone in the trial (`notebook/unsent-notes/`) is not read by the phone's page, and stays on the disk; what was sent from it lies in the inbox and is taken in. Earlier versions are no worry yet (the owner's word, 2026-11-19).
- **The fourth finding** of *For stage 2*: a file that stops being the notes' stays on a phone; a phone that leaves and joins again offers again the records of files it never held. Nothing is lost by either, and neither is mended.
- **The tree of projects** read from the home document. **A setting that follows the writer** to a phone: none does.
- **The thread that looks at the inbox**, on a phone. **Tests of the Kotlin** run by Gradle. **A name for the phone** as its owner gave it in Android's settings: the model is offered.

### After stage 2: what the second reading of part A left, and what the running app found

1. **A device back after a while** keeps once, and sends again, a picture deleted elsewhere while it was away: its first round judges by what the notes held when it last ran. One round trip a picture, nothing lost; the mend, should it be wanted, is to keep without forgetting the base and decide at the next round.
2. **Narrow windows for a lost file of the library**, each needing a crash or a failure at that moment: between the library's reading at a start and the engine being made; between the guard and the library's own reading within a round; a `sync.json` that cannot be read at the moment the guard asks. And a `library.bib` that is there with nothing in it reads as emptied.
3. **`waiting` is false** where a phone's notes are held back by a home document or a notebook of a later form; the line then says what `problem` says.
4. **A file left to try again** waits the half minute, not at once, also when the app is behind, so that a file that fails for its own sake does not make the engine ask without pause.
5. **On Android a body of bytes arrives as JSON**: found on the emulator, where nothing written on the phone was kept until `with_head` took that form (record 0123).
7. **The owner's rule of 2026-11-23: where the form has changed, the synchronization stops** on the older device as a whole, a computer or a phone, which says *Update is needed for synchronization*. Today a later form ends a round only where it is the home document's; a later notebook leaves the references going on a phone, and a later project is refused alone on a computer. To be built, by the most capable model, at the head of the next stage.
8. **A full home shows as "cannot be reached"** (found on the owner's computer, 2026-11-23, an inference not yet confirmed): the server refuses a file of a home that is full, or too large, before the computer has sent all of it and closes the connection; Caddy tells the computer 502, and the engine takes it for the network. A full home is to say that the server is full. The owner's library is some 25 GB; a home may hold 10 GB unless the server is told more.
9. **The server's guide** is to say how its data folder is put on another disk: a bind mount over `/var/lib/private/glaukopis-server` in `/etc/fstab`, `RequiresMountsFor=` in a drop-in, the unit's protections kept; and how the limits of a home are raised. The owner does it later.
10. **The pictures of the owner's notes** do not open on the owner's computer ("No such file or directory"): their records are there and their files are not. Not yet known whether they came from another device and wait to be fetched (the server answered 502 then), or are lost. To be looked into first, with the owner's leave to read the logs of `~/.local/share/glaukopis/logs` and nothing else.
   **Looked into on 2026-11-23**, by the newest log alone (the run begun at 11:17 and still running at 12:05) and the code. The log has eleven lines: the start, the library read, and one file of 740 MB not sent, the server taking 512 MB at the most; in 47 minutes no file failed to be fetched and no round failed in a way the engine says. Two things in the code hide the rest. (1) A round that ends because the server was not reached is never written in the log (`Sync::once`, `Error::Network`), and an answer of 502 from Caddy is such an end (`Remote::refusal`), so the log cannot say whether every round has been failing. (2) `files::bring` sends every file the home lacks before it fetches any, and ends at the first failure of the server: with a home that refuses what is sent because it is full, every round ends in the sending, and nothing is ever fetched. So the likeliest reading: the pictures were taken in on another device; either that device cannot send them past a full home, or they are on the server and this computer never comes to fetch them. They are not lost in either case. Should they have been put in on this computer, it is another matter, and is looked into again. To be mended with item 8: a failed round said in the log when its reason changes; a file that does not fit said before it is sent, and passed over; the files the notes hold sent first and the smallest before the largest; and the fetching not held back by a send that fails.
6. **The settings' script** (mended on 2026-11-23: the sentence is the owner's) has failed since the synchronization was built: the sentence under *Synchronization* counts as a help text. The owner's to say.

### Chosen here, to be told

With the other choices that await the owner.

1. A phone sweeps out no file, and so keeps the pictures of notes that were deleted.
2. On every device, a computer too: one whose notebook was refused sweeps nothing until it is taken again; what the notes of a device hold is never taken from it by what another device said; what the notes hold is said when it changes; a file of the library that is not on the disk is taken as lost and not as emptied.
3. A phone that is not in front asks the server nothing; it makes a round when it leaves the front and when it comes back. In front it asks every half minute, as a computer does.
4. The line over the notes is there where what was written waits for a server that is not reached, or the synchronization says a problem, and nowhere else: not where the device is in no home, and not where the server is not reached and nothing waits. It is over the notes only, not in a note.
5. The system's Back closes what lies over a place (a sheet, a question) before it leaves the place.
6. A new note lies in the box in view, and in the box that receives where all notes are shown.
7. `sync-about` goes on saying *computers*, and the names of the messages stay.
8. The name offered for a phone is its model, as the system says it (`SM-S908B`).
9. On a phone the system's language is the one the web view says.
10. A box can be made on a phone, where a note is moved; nothing else of the boxes.
11. *Redo* is under *More*, not in the row over the keyboard, which has room for seven at 320.
12. The app starts at the notes each time.
13. The settings of a phone offer the colours of the system, light and dark, and not *Mellow* or one's own.

### For the owner

Nothing here stops the building. These are the owner's to say:

1. **An outdated phone, and a home document in a later form** (the third finding). Today such a phone ends its whole round and says that Glaukopis must be updated, as a computer does, though it writes nothing into that document: notes written on it stay there until the app is updated. Should it go on with its notebook, it is one rule changed in `home_read`, with a test. It is built as it is today until said otherwise.
2. **A phone that never sweeps.** It is the careful one. Should the room matter, the next step is the core reading from the notebook itself which files the notes hold, so that no device answers a sweep by what its page last said; that is a piece of work of its own.
3. **The new words**, in the tables above, in English and Bokmål: the two lines over the notes, the sentence under *Synchronization* on a phone, and the question before the last device stops. They are built as written until said otherwise.
4. **Light and dark chosen on the phone** is offered only if the system's bars can be made to follow; where they cannot on the emulator, the phone follows the system alone, and the owner is told.

## Who builds what

The way that held on 2026-11-13 and 2026-11-16: the main thread reads the code, settles every choice and writes one part of the plan for each agent (the decisions, the files, the names and properties where two parts meet, what to verify); each agent builds in a worktree of its own; the main thread reads every diff, merges, builds once and runs the application.

| Part | Who | Why |
| --- | --- | --- |
| Stage 0, all of it | the main thread, on the most capable model | Done. Every finding changed the plan. |
| 1: the shell divided by role, `--phone` | the main thread | It goes on from the trial's own code, through `lib.rs`. |
| 1: the web view looked at by the Android part | the main thread | Kotlin that no agent can try: it runs only in the app. |
| The detailed part of each stage, written before it is built | the most capable model | It is the design: a builder is as good as what it is given. |
| 1: what a device takes, in the engine, and its tests | the most capable model, which also reads it once more before it is merged | Small, and a wrong rule here loses what the server keeps. |
| 2: what the notes hold, kept: when a device sweeps, what is never taken from the notes, a lost file of the library, in the core and the shell, with their tests | the most capable model, which also reads it once more before it is merged | A wrong rule here deletes the writer's files, on every device. |
| 2: the phone's commands, the meeting points, the ground behind the system's bars in Kotlin, the scripts run | the main thread | It goes on from stage 1's shell, and the Kotlin runs only in the app. |
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

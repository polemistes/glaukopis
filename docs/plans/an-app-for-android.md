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

- **The shell.** The sources of `src-tauri` are a second package, `src-phone`, built for Android alone and empty elsewhere, so that a build for a computer makes nothing for the phone (record 0121). The phone has a role of its own in `src-tauri/src/phone.rs`: one window labelled `phone`, the data folder in the app's own place (`DataDir::at`), the engine, and only the commands the phone's page calls (the notebook's, the synchronization's, the languages, the settings, the log of the page). What is a desktop's alone stands behind `cfg(desktop)`: the single instance, windows made and placed, printing, the clipboard through GTK, the window of a note, Firefox. `lib.rs` is divided by role as this is done, not added to.
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
2. **A newer form.** A phone whose app is older than the form of the notebook is refused by the server (`later`). It says that the app must be updated, and writes nothing.
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
1. **The role, and what a phone takes.** The shell divided by role, `glaukopis --phone`; a web view too old said by the Android part; the engine told what a device takes, with its tests against the server. (The phone's data folder and the backup turned off were done in the trial.)
2. **The notes shown, found and written; the synchronization set up.** The page of the phone. *Device* for *computer* in the words of the synchronization, on the computers too, with an addendum to its record. From here the owner has an app to use: a note written on the phone is on the computer.
3. **Collecting.** Share, the selection's menu, the photograph, pictures and files, *New note* on the icon; sent when closed.
4. **Given out.** The signed file, the job of the workflow, the newer version told, the website's folder, the chapter of the guide, the other languages in a round.
5. *Later, should the owner want it:* **text read on the phone.** Photographs measured first; then Tesseract brought along, the languages, *Read the text*; PDFs after.
6. *Later:* the rest of the notebook by finger: the surface of a box, Join and Divide, links.
7. *Later:* **maps shown.** The tree of projects from the home document; a project fetched when it is opened and kept from then on; read as text and as the diagram.
8. *Later:* **maps edited.**

## Who builds what

The way that held on 2026-11-13 and 2026-11-16: the main thread reads the code, settles every choice and writes one part of the plan for each agent (the decisions, the files, the names and properties where two parts meet, what to verify); each agent builds in a worktree of its own; the main thread reads every diff, merges, builds once and runs the application.

| Part | Who | Why |
| --- | --- | --- |
| Stage 0, all of it | the main thread | Every finding changes the plan. The emulator and the builds run one at a time. |
| 1: the shell divided by role, `--phone` | the main thread | It goes on from the trial's own code, through `lib.rs`. |
| 1: what a device takes, in the engine, and its tests | the main thread | Small, and a wrong rule here loses what the server keeps. |
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

About two thirds of what is written (the page, its words, its tests, its scripts, the translations) goes to Opus and Sonnet. That is a guess before stage 0. What stays is where a fault costs the writer's things or cannot be seen without the running app.

For every agent, from what was learned: the first step is to see that this plan is in `git log` of the worktree, else `git merge --ff-only <commit>`; what matters of `.claude/briefs/common.md` is quoted in its prompt, since the briefs are not in git; every step is committed and a note of progress kept; `pnpm check` and `pnpm test`, and where Rust changes `cargo fmt`, clippy and `cargo test -p glaukopis-core -p glaukopis` with the main thread's `target/`; never the application's binary, never a build for Android, never the emulator.

## Left for later

- **A thing collected without the app coming to the front.** Taking in is the page's work; it would have to be the core's.
- **A widget** on the home screen, **sound recorded**, **a code read by the camera** to join a home.
- **Fetching at regular times** with the app closed, and **a word from the system** when something arrives.
- **A choice of sending files only on Wi-Fi**, should the files prove heavy.
- **A wider page for tablets.**
- What the synchronization left for later holds here too: encryption on the devices, so that the server keeps what it cannot read.

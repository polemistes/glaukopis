# 0122 — A phone among the writer's devices: what it takes, its role, and the web view looked at first

Date: 2026-11-23. Status: stage 1 of the plan `docs/plans/an-app-for-android.md`, built from its section *Stage 1, in detail*, which is the specification and says what each part does. Builds on 0120 (the synchronization), 0121 (the trial: the package `src-phone`, the floor of Android 8.0). The choices beyond the owner's words are listed in the plan under *Chosen here, to be told* and are not yet confirmed by the owner.

## Context

- The owner decided that a phone holds the notebook, the files its notes hold and the references without their files, and nothing else; and that the app works on any Android phone people still use.
- The synchronization knew one kind of device, a computer, which holds everything, sends what it lacks to the server and takes off it what was deleted. A phone that rounded as a computer would, with its empty disk, have told the others that everything was gone.
- On Android 8 with no usable web view the app stopped with Android's own words before anything of Glaukopis ran (0121).
- The shell held all its roles in one file of 927 lines, and on a phone everything of it was allowed to lie unused.

## Decision

1. **A device takes everything or the notes** (`sync::Takes`, kept in `sync/sync.json`, given by the role that makes the engine). A device does no more than its role and what it joined as both allow. A phone's round asks for the home document with nothing sent and writes none of its stores, touches no project, exchanges the notebook and the library's document as a computer does, sends the files it takes in, fetches only the files a note holds, and never takes a file or a document off the server or says that a project is gone. A computer's round is as it was.
2. **What holds it**: eleven tests against the real server (`crates/server/tests/phone.rs`), among them a phone that leaves last, a phone older than the form of the notebook, a computer that never learns of deletion from what a phone lacks, a phone whose trash holds projects, and a server that holds less of the home document than the phone saw. Each rule was tried by putting its fault into the engine. Built by the most capable model and read once more by another, given the diff and the specification and not the builder's account; the reading found no path by which a phone writes what it must not, and what it found besides is in the plan for stage 2.
3. **The shell is divided by role**: `starting.rs` (what every role starts with), `application.rs`, `note_window.rs`, `phone.rs`. On a phone only the commands and the state may lie unused; printing, new windows, Firefox and the two roles of a computer stand behind the desktop.
4. **The phone is a role of its own**: its folder opened and claimed as the application's, into the same state the engine shares; the engine told it takes the notes; its window labelled `phone`, since a window of a note may close itself and the phone's must not; the commands of the page of a note and of the synchronization, nothing of the projects. Until stage 2 its window shows the page of a note.
5. **`glaukopis --phone`** is the same role on a computer, for trying it with the harness, in a window as narrow as a phone; its folder is `GLAUKOPIS_DATA_DIR` or `glaukopis-phone` beside the application's, and the application's own is refused before anything starts.
6. **The web view is looked at before anything of Glaukopis loads**, by an activity of its own (`StartActivity`), which the launcher starts. Where the web view is older than 111, or there is none Android will use, it says so in a plain screen with what to update and a button to the app store, in Android's own string resources in English and Bokmål; otherwise it starts the page. The page is started by the app alone.

## What was tried

- `e2e/phone-role.mjs`, with a real server and the application beside the phone's role: one window labelled `phone`, the commands of the projects refused, a note sent and kept in the inbox while the window stays; joined by a code, the phone holds the reference and no project, setting or file of the library. 15 of 15.
- `e2e/synchronization.mjs` after the merge: two computers as before, 32 of 32. `e2e/note-window.mjs`: 55 of 55, after the division and after the page's entry changed.
- `e2e/android/web-view.mjs`: on the emulator of Android 8.0, whose image has no web view Android will use, the screen says there is none and the app keeps running. Its old web view (58) is installed but cannot be made the one in use, so the words for a web view too old were tried on the emulator of Android 16 with the least version raised to 200 for one build: "This device has version 134 of it, and Glaukopis needs version 200 or later"; with no app store there, the button takes itself away. With the real number the page of a note starts there and is typed in as before.
- A release for 64-bit ARM phones, now that the phone's role reaches the engine and the state: the library 27.7 MB and the app 29.5 MB, from 20.2 and 22.0 in the trial; built in two and a half minutes after the build for trying.

## What this does not do

- The page of the phone, joining a home from it, *device* for *computer* in the words, and what a phone does about the sweep: stage 2. The plan lists what the second reading found for it.
- Removing a web view on the old emulator and putting it back was not tried, since that image names none.
- Nothing of it was tried on the owner's phone: nothing there changes until the page of stage 2, but for the screen that looks at the web view, which passes a phone that is kept up.

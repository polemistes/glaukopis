# 0124 — Collecting on the phone: Share, the camera, New note, and a round with the app closed

Date: 2026-11-23. Status: stage 3 of the plan `docs/plans/an-app-for-android.md`, built from its section *Stage 3, in detail*, which is the specification; its choices beyond the owner's words are listed there under *Chosen here, to be told* and are not yet confirmed by the owner. Builds on 0102 (the inbox), 0120 (the synchronization, and its addendum of this day), 0121 to 0123 (the trial, what a phone takes, the page of the phone).

## Context

- The owner asked for an app that collects notes. After stage 2 the phone showed, found and wrote notes; nothing came to it from another app, and what was written there waited for the app to be opened again before it was sent.
- What Android hands over on a share, what the camera hands back, whether Rust can be reached with no window, and whether Android runs a piece of work with the app closed, were not known. Ten trials on the emulator came first, with a trial app thrown away after.

## Decision

1. **What another app hands over is a sixth kind of thing in the notebook's inbox, `shared`**: its words as they came, its subject, its files by what they hold. Nothing of it is read as HTML, and nothing is fetched. The page makes a note of it in the box that receives, not looked at: an address shared alone is the note's text, a passage of that page, and the subject names the note and the page; any other words are one passage with no source and no name, kept as they came (Chrome puts quotation marks around a selection and says `Including link:` as its subject, which the program cannot tell from a writer's own); each file follows with itself as its source, a picture as a figure.
2. **`StartActivity` reads a share itself**, copies each file out of the other app's keeping into a folder of the app's own, and puts the thing into the inbox through the door before anything else is started: the leave to read another app's file is sure only while the activity given it lives. The page is told the name of the thing and nothing else, goes to its note, and Back from there puts the app behind the others, so that the app one shared from is in front again. The same activity takes the menu over selected words (*Glaukopis*, by its label) and *New note* on the icon held down.
3. **`StartActivity` has a task of no affinity, kept out of the recent apps.** In the page's task it stayed that task's first intent, and Android takes a second share, or *New note* a second time, equal to it in all but its words, as asking only for the task to be brought to the front, and starts nothing: found on the emulator, where every script of the computer and every trial had passed.
4. **The door** (`src-tauri/src/door.rs`): two functions of the shell that the part in Kotlin calls by their names (JNI) with no window, one that puts a thing shared into the inbox, one that makes a round of the synchronization. **One opening of the data folder in a process**: what the process has of it is nothing, the door's (for the rounds under way), or the role's; the role, when it starts, takes over what the door opened, the same state and the same engine, so that the app opened during a round never finds its own folder in use. The trials found that both happen in one process.
5. **A round is asked of Android whenever the page leaves the front** (WorkManager, `Round.kt`), with a network as its condition, tried again eight times at the most where the server was not reached. With the app ended, Android starts a process for it alone, and the door opens the folder there.
6. **In a note, *Photograph* and *Picture or file*** are two fields of files behind two buttons of the row over the keyboard; a file is sent to the shell in pieces of half a megabyte, at most 50 MB. The camera's file, which the web view leaves in the app's folder, is removed when it has been taken in; where Android ended the app while the camera was in front, the photograph becomes a note of its own when the app is next made.
7. **The keyboard is asked of the Android part** for a new note made for the icon: Android shows it by itself only after a touch.
8. **Asked of the user: nothing.** WorkManager brings four ordinary permissions with it (the network's state, keeping the phone awake for a round, being told the phone has started, a service in the front that is never started), and AndroidX one of its own for its receivers.

## Who built what

The design, the trials' corrections and the engine's mends of the same day (Fable); the kind `shared` in the core and its reading by the page, and a file taken in by pieces (Sonnet); the page's arriving, *Photograph* and *Picture or file* (Sonnet); the ten trials, the meeting points, the door, the Kotlin, the manifest, the merges and every run of the app (the main thread, on Opus). Each diff was read before it was merged.

## What was tried

- Beside the code: the door's seven tests (a device in no home opens nothing; a server not reached is tried again and the claim let go; the role takes over a round under way; two rounds at once; a thing shared put with no application running); the core's tests of `shared` and of the pieces; the page's of asking, arriving and taking.
- Through `glaukopis --phone`: `phone-closed` 11 (`glaukopis --phone --round` as Android runs it: in no home, the server away, the server back with the role never started, beside the running role), `phone-collect` 43, the phone's role 14, its synchronization 54, the notes 36, a note 29; the synchronization of the computers 32, the window of a note 55, the plugin 36.
- On the emulator of Android 16: `share.mjs` 23 (words, an address, Chrome's selection, the app behind and ended, the selection's menu from the shell and by taps in Chrome, which hands the word over without quotation marks, a picture from the app of files, a share of nothing, a file too large), `collect.mjs` 11, `closed.mjs` 11 (a note sent with the app ended, and swiped away; a round with no window under way while a file of 40 MB goes over a slow network, the app opened meanwhile, the role taking it over); `page.mjs` 15 and `sync.mjs` 4 again; on Android 8 with no web view, a share lies in the inbox. A release for the emulator's processor, shrunk by R8, took a share, *New note* and its round as the debug build does.

## What this does not do

- The signed file, a newer version told, the chapter of the guide and the other seven languages: stage 4. A trash for notes: the stage after this one.
- Samsung's keyboard, the gesture for Back, a share from the owner's own apps, the camera of a real phone: the owner's phone, by hand.
- Android's small message for a file too large is not in the window's dump; that it is shown is seen on the phone.

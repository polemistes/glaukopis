# 0123 — The page of the phone, and what the notes hold, kept

Date: 2026-11-23. Status: stage 2 of the plan `docs/plans/an-app-for-android.md`, built from its section *Stage 2, in detail*, which is the specification; its choices beyond the owner's words are listed there under *Chosen here, to be told* and are not yet confirmed by the owner. Builds on 0120 (the synchronization; its addendum of this day says *device*), 0121 (the trial), 0122 (what a phone takes).

## Context

- The owner asked for an app that collects notes, synchronizes and shows them. After stage 1 the phone could join a home only by a command, and showed the page of a note.
- The second reading of stage 1 found that the files the notes hold could be swept out on one device and lost elsewhere, and that a lost file of the library could be read as an emptied one.
- What a page on Android does with the system's Back, the app leaving the front, and the size of the letters was not known.

## Decision

1. **The phone has a page of its own** (`src/lib/phone/`), in one column from 320 pixels: the notes, found by words and filtered by box and tag, with a line only where something waits to be sent or is wrong; a note, with its name, tags, box, text and sources, and a row of tools over the keyboard that keeps the cursor and the keyboard; the settings, with the synchronization made to fit, the language and the colours. Nothing is reached only by a long press, the right button, a double click or a pointer resting on a thing, and what is shown under a pointer is shown only where there is one (a test holds every file the page draws to it).
2. **The page keeps its own steps** and answers Android's Back through Tauri's `back-button` event: it closes what lies over a place, goes to the place before, and at the notes puts the app behind the others with its process kept. Tried first on the emulator: two steps of the web view's history did not count, and Back with them left the app and ended its process.
3. **The Android part gives the page two things** (`window.glaukopisAndroid`): the ground behind the system's bars, which follows the page's colours, and leaving the app.
4. **What the notes hold is kept** (part A, built by the most capable model and read twice by another): a phone never sweeps out the files no note holds; a device whose notebook was refused sweeps nothing in that run; a record or mark said gone is never taken from what the notes here hold, and a mark kept so is the library's and the notes'; a lost file of the library is remembered from the moment the engine is made, so that no start can read it as emptied; what the notes hold is said when it changes and once when the sweep has answered. The first reading found two severe faults in the first build, both mended with tests that failed before: a picture a document shows could be deleted from every computer and the server, and every file of the library could be told as taken out after a lost file.
5. **Whether something waits to be sent** is asked against the moment kept at the last exchange; **a phone's engine rests** when the app is behind, with a round on leaving and on coming back.
6. **On Android a change sent as bytes is taken in as JSON**: Tauri's page side cannot send a body by its own protocol there, and every change of the notebook was refused, so that nothing written on the phone was kept. Found on the emulator; the scripts of the computer could not have found it.
7. **The words say *device*** where a phone may be meant (0120's addendum), and the device's name offered on Android is its model.
8. **The language** is what the page knows Android speaks, where the core may not be let read it; `GLAUKOPIS_LANGUAGE` still wins, for the scripts.

## Who built what

The design (Fable); part A (Fable, read twice by another Fable); the page and its places (Opus); a note (Opus); the settings and the words (Sonnet); the meeting points, the commands, the Android part, the merges and every run of the app (the main thread, on Opus). Each diff was read before it was merged.

## What was tried

- Through `glaukopis --phone`: the phone's role 14, the notes 36, a note 29, the settings with the synchronization against a real server 54, a note written on the phone on the computer and one written there on the phone.
- The application's own scripts: the synchronization 32, the window of a note 55, the notebook 41, languages 17, the settings 24 of 25 (the one that fails has failed since the synchronization was built: the sentence under *Synchronization* counts as a help text).
- On the emulator of Android 16: `page.mjs` 15 (Google's keyboard; Back four ways; the engine resting when behind; the note there after the app was ended; the bars dark with the page; letters at 1.3; Bokmål where Android is); `sync.mjs` 4 (joined from the phone's settings over the emulator's network, notes both ways, the model offered as the name); `typing.mjs`, `marks.mjs` and `web-view.mjs` on the new page.

## What this does not do

- Share from other apps, a photograph, *New note* on the icon, a round with the app closed: stage 3. The signed file, a newer version told, the chapter of the guide and the other seven languages: stage 4.
- Samsung's keyboard, the gesture for Back and an old phone with its web view kept up: the owner's phone, by hand.
- The second reading's lesser findings, written into the plan for later: a device back after a while keeps once, and sends again, a picture deleted elsewhere; a few narrow windows for a lost file of the library, each needing a crash at that moment; `waiting` false where notes are held back by a later form.

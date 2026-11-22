# 0121 — Glaukopis on Android: what the trial found

Date: 2026-11-22. Status: the first stage of the plan `docs/plans/an-app-for-android.md`, the trial, done on that day on the owner's word ("Start it."). It decides how the application is built for Android and what the plan is corrected by. The app itself is not built: what runs is the window of a note (0109) on a phone. Samsung's keyboard was tried by the owner on the owner's phone. Builds on 0109 (the application in another role), 0111 (the form of the texts, why there is no second editor) and 0120 (a phone will be one more of the writer's devices).

## Context

- The owner asked for an app for Android that collects notes, sends them to the notebook, synchronizes and shows them, with maps later, and that it "should work for any android phone that people still use".
- The plan put one stage before all building: a trial of what was not known. Whether the core and the shell build for Android at all; whether the editor of the texts, which is ProseMirror, holds under a phone's keyboard with its composing, suggestions and corrections; what the newest and the oldest Android make of the page; whether a script can reach the app.
- Rust on this machine is the distribution's, which has no targets for Android and no `rustup`.

## Decision

1. **The same application in another role, on the system's web view.** The core builds for Android unchanged but for TLS; the shell with two things kept to computers (printing, the single instance); the page as it is. No second editor and no second reading of the notebook's document.
2. **TLS by rustls on Android alone** (`crates/core/Cargo.toml`, `net::tls`), since Android has no OpenSSL to link to. The computers keep the system's TLS. Both trust the same authorities: Mozilla's list as it is compiled in, which is what `ureq` trusts where nothing else is said and what the computers trusted already. A server with a certificate of an authority of one's own is refused on a phone as on a computer.
3. **The phone is a package of its own over the same sources**, `src-phone`: its library is `../src-tauri/src/lib.rs`, it is built for Android alone, and where it is built for anything else it is empty (`phone_elsewhere`, told by its `build.rs` and read by the first line of the library). The usual way, a second kind of library of the one package, would have linked the whole application once more as a shared library with every build for a computer: over a gigabyte in a build for trying, and a second optimising in a release. Its dependencies are for Android alone and are those of `src-tauri/Cargo.toml` without what is a computer's: they are kept the same by hand.
4. **Tauri's tool is run from `src-phone` by its own place** (`../node_modules/.bin/tauri android …`), never through pnpm: pnpm starts it in the folder of `package.json`, where it takes `src-tauri` for the application. The Android project calls it the same way (`BuildTask.kt`).
5. **The Android project is kept in git** (`src-phone/gen/android`, without what a build leaves in it). What is ours in it: the backup to Google off (`allowBackup`, the rules of what is carried to a new phone); the camera app named as one the app asks; the page kept clear of the system's bars and of the keyboard (below); the owl as the icon (`packaging/android/make-icon.py`); the least Android.
6. **The page is kept clear of the system's bars and the keyboard by the Android part, not by the page** (`MainActivity.keepClear`). Android now draws every app behind its bars and lays the keyboard over it. Left so, a tap on what lies under the bar at the top never reaches the page (the row of tools could not be pressed), and what is written at the foot of a long note is written under the keyboard. What holds the web view is made smaller by as much as the bars and the keyboard take; the page needs to know of neither, and its height follows the keyboard.
7. **The least Android is 8.0, not 7.0.** Tauri's own part for Android says it runs from 7.0 and does not start there: its JSON library (Jackson 2.15) asks for a class of Java (`BootstrapMethodError`) that Android has from 8.0. Seen on the emulator of Android 7.0: the app stops before anything of ours runs. By Google's count of October 2026 that is 990 of 1000 devices in use for 994.
8. **A web view too old, or none, is said by the Android part, before the page**: the page cannot say it, since it does not run there. Not built. Seen on the emulator of Android 8.0, whose image has no web view that loads: the core starts, writes its log, and the app then stops with Android's own words.
9. **The camera is the phone's camera app**, asked through a field of files of the page, with no permission of the app's: it works once the manifest names the camera app as one the app asks (since Android 11 an app is otherwise told there is none, and the web view shows the picker of pictures instead, without a word).
10. **What is never called is not in the app.** The library of a release is 20 MB and the app 22 MB for one kind of processor, with typesetting, the reading of scans and all else of the core compiled: the linker leaves out what the phone's role does not reach. No feature of the core is needed to leave typesetting out, and the plan's question of a core in two shapes is closed.
11. **A build for trying comes without its debugging symbols** (`CARGO_PROFILE_DEV_STRIP`, in `packaging/android/env.sh`): with them the app was 1.1 GB and did not go onto an old device at all; without, 42 MB.
12. **Rust's own toolchain beside the system's**: `rustup` in `~/.rustup`, the same version of the compiler, with the targets for Android, on no `PATH` but that of `packaging/android/env.sh`, which is sourced for a build for Android and for nothing else.
13. **The app is tried on emulators without a window** (`e2e/android/`): two devices, the newest Android and the oldest the app runs on, each a capped unit on a port of its own, so that a script names its device and can never reach a phone that is plugged in. `adb` for what is the system's; the web view's own door for debugging (the DevTools protocol over `adb forward`, with Node's own WebSocket) for what is the page's; and the real keyboard typed on key by key with taps, since what a script sends as keys of a hardware keyboard tries nothing of a keyboard's composing.

## What was tried, and how it went

On the emulator of Android 16 (web view 134), with Google's keyboard, in the app built for trying, by `e2e/android/typing.mjs` and `marks.mjs`:

- words composed letter by letter, a capital by itself at the start and after a full stop; a suggestion taken from the row over the keys, which replaces what was being composed; Enter begins a paragraph; Backspace takes away, over the edge of bold too, and joins a paragraph at its start;
- bold begun and ended from the row of tools while the keyboard is up, the cursor kept: what is then composed is bold;
- a list begun, a second point by Enter, left by Enter twice;
- the note kept on disk by itself, and in the field again at the next start;
- a photograph taken in the camera app arrives in the page as a JPEG;
- Back: once puts the keyboard away, once more leaves the app.

The release as the owner is given it was built for the emulator's processor too and typed in there.

The core's own tests as a program of 32 bits, on the emulator of Android 8.0 (which runs both): 1044 pass, 18 are left out as on a computer, 26 fail, every one of them for a file of the machine it was built on (a fixture by its path, the system's dictionaries, its fonts). None fails on a number that did not fit.

A build: the core checked for Android in a minute; a release built anew in four minutes; the app for trying after a change in a minute or two (its first build, of everything, was the longest and was not timed). On disk: 6 GB of `target/` for each kind of processor built for trying, 2.4 GB for a release; 1.2 GB for `rustup`; 3 GB for each system image of an emulator.

On the owner's phone (a Samsung Galaxy S22 Ultra, Android 16, Samsung's keyboard), by the owner's hand, the same day: "Most things seems to work." One fault was found: a tool of the row that was turned off again still looked on. It was off; a touch screen leaves the last thing tapped as if the pointer stayed over it, and a button with an icon shows a ground under the pointer. That ground is now shown only where a pointer can be over a thing without pressing it (`IconButton.svelte`; `e2e/note-window.mjs` holds a computer to having one).

## What this does not do

- **Samsung's keyboard** was tried by the owner's hand and not by a script: no emulator has it. The app given for it is in `packaging/android/out/`, signed with this machine's key for trying, not the key the app will be given out with.
- **An old Android with its web view kept up** (138 on Android 8 and 9) is not tried: the emulators' images come with the web view of their day, and none was found that could be brought up without a Google account. What the page asks of a web view is counted from the source (111) and not run on one that old.
- **A share from another app** was not tried: that Tauri hands what another app gives to a plugin in Kotlin is read in its source (`Plugin.onNewIntent`), and built in the plan's third stage.
- **The app built for 32 bits** was checked (it compiles) and its core tested as above; the app itself was not started as a 32-bit one.
- **The roles of the shell are not yet each a file of their own**: on a phone what the roles of a computer are made of lies unused, and is allowed to (`lib.rs`). The plan's next stage divides them.
- **The colour behind the system's bar** is Android's own, not the page's; and in the dark it is not tried.

## Chosen in the building, and not asked

1. `rustup` installed in the owner's home (`~/.rustup`), since the targets could not be had otherwise; told at once.
2. The package for the phone as a second package over the same sources, for what it spares every build for a computer.
3. The floor moved from Android 7.0 to 8.0 on what the emulator showed, over mending Tauri's dependency by hand.
4. The folder of the data: `files/data` in the app's own folder.
5. The row of tools of the window of a note goes on in a second row, and the whole field takes a tap, where the pointer is a finger (`NoteWindow.svelte`): so that the trial could be used on a phone. A computer with a mouse sees no change.
6. Two system images fetched into the owner's Android SDK for the emulators (Android 7.0, removed again, and 8.0), and two emulator devices made beside the owner's own, which are not touched.

# 0084 — The data folder, chosen by the writer

Date: 2026-11-06. Status: proposed on 2026-11-06, from the owner's words of the same day ("It is time to implement the possibility to choose where the data folder resides."), with the plan `docs/plans/the-data-folder-more-than-one-window-favourites-and-the-copied-space.md`; to be built when the owner has read it. Builds on 0032 and 0035 (what the data directory holds) and on the claim one Glaukopis holds on the directory while it runs.

## Context

- **Everything is in one folder.** `DataDir` in `crates/core/src/paths.rs` lays it out: the library and its files, the projects, the styles, the formats, the templates, the dictionaries, the languages, the own words, the settings, the logs and the work folder. Where it is comes from the system, `~/.local/share/glaukopis` on Linux, `~/Library/Application Support/glaukopis` on the Mac, `%APPDATA%\glaukopis` on Windows, or from `GLAUKOPIS_DATA_DIR`, which the tests and a portable installation set. The settings window shows the path under *Where everything is kept*, with *Open*. Nothing lets the writer choose.
- **Why a writer wants to.** A bigger disk or partition than the home folder is on; a folder that is backed up, or synced; an external disk that goes between two computers; a home folder that is not theirs to fill.
- **What makes it more than a setting.** The setting of where the settings are cannot live in the settings. The folder is held open the whole run, the library in memory, the claim on `.in-use`, the caches, the child processes: it is not switched under a running program. And it can be many gigabytes, with the files of the library in it, which a move to another disk copies.
- **The claim.** While one Glaukopis works in a folder, another started on the same folder says so and ends: two cores would write the one `library.bib` over each other. Where the file system cannot lock, the folder is used without a claim.

## Decision

1. **A small file says where the data is**, outside the data folder, in the place the system gives a program for its settings: `glaukopis/data-folder.json` under `$XDG_CONFIG_HOME` (`~/.config`) on Linux, under `~/Library/Application Support` on the Mac and under `%APPDATA%` on Windows, where it stands in the folder the data is in by default, which then holds only this file once the data is elsewhere. It holds the folder and, while a move is under way, where the data is moved from. No file: the system's place, as today. `GLAUKOPIS_DATA_DIR` wins over the file as it wins over the system's place, so that the tests and a portable installation are as they are.
2. ***Where everything is kept*, in the settings, gains *Change…***, which asks for a folder. What is done depends on what the folder holds, and the dialog that follows says which, with *Cancel*:
   - **Empty, or not yet there**: *Move everything to “…”*. Everything is moved there.
   - **Holding Glaukopis's data already**, a `library` folder with `library.bib` in it, or `projects`: *Use what is in “…”*. The folder is used as it is; nothing is moved, and what is in the folder used till now stays where it is, unused, which the dialog says.
   - **Anything else**: refused, *The folder is not empty*. Two sets of data are not merged.
   Both say that Glaukopis closes and starts again.
3. **How a move goes.** On the same disk it is a rename, done at the next start, instant. On another disk the files are copied before Glaukopis closes, with progress in the dialog, so many of so many files, `work/`, which can be made again, and `.in-use` left out, and every file checked by its size when the copy is done. Then Glaukopis closes as it does, saving everything, and starts itself again; at that start, before the data is opened and with nothing in use, what was written while closing is brought over, the files newer or missing, the rename is done where it is one, and the old folder is removed once every file is in place. What fails leaves everything where it was, the file saying the old place, and is told when the window is up.
4. **A chosen folder that cannot be opened at start**, a disk not plugged in, a path gone: a dialog says which folder and why, with *Use the usual folder* for this run and *Quit*. The file is left as it is: the next start tries the chosen folder again, and the settings show where Glaukopis is working meanwhile.
5. **The guide** says how, under *Keeping things safe*: the two cases; that the old folder is removed after a move and kept after *Use*; and that a folder synced between computers is worked in from one computer at a time, since the claim refuses a second Glaukopis only where the file system can lock, and no sync service keeps two programs on two computers from writing the same library.

## Choices made in writing this

1. **A file in the settings place**, not a flag or an environment variable: the writer should not need a shell, and the variable stays for those who do.
2. **Move or use, decided by what the folder holds**, not asked: an empty folder has nothing to use, and a folder with data has nothing to be moved into, since two libraries are not merged.
3. **The copy before closing, the rest at start**: the writer sees the copy go, and the folder is never switched under the running program. A rename needs no copy and is done at start alone.
4. **The old folder removed after the check**, not kept: a copy of several gigabytes left behind in silence is a trap, and the check is of every file. After *Use what is in*, nothing is removed: the writer chose to leave it.
5. **The usual folder for one run** when the chosen cannot be opened, rather than the choice reset: an unplugged disk is plugged in again.
6. **The words**: *Change…* / *Endre …*; *Move everything to “{ $path }”* / *Flytt alt til «{ $path }»*; *Use what is in “{ $path }”* / *Bruk det som er i «{ $path }»*; *The folder is not empty.* / *Mappen er ikke tom.*; *Glaukopis closes and starts again.* / *Glaukopis lukkes og starter på nytt.*; at start, *Use the usual folder* / *Bruk den vanlige mappen* and *Quit* / *Avslutt*.

## Consequences

- The shell gains a step before the data is opened: read the file, finish a move that is under way, open the folder it names, or the usual one on the writer's word.
- The harness sets `GLAUKOPIS_DATA_DIR`, so a script never sees the file; the file and the move are tested in Rust, the dialog in a script through a hook for the folder picker, as far as the file written and the application closing. When the harness runs the application, *Change…* ends it instead of starting it again, since the driver cannot reach a program it did not start.
- Not built: two folders switched between; merging two folders; a progress for the rename and for the pass at start, which are short.

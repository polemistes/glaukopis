# 0099 — Told of a new version, on Windows and macOS

Date: 2026-11-14. Status: built on 2026-11-14 from the owner's words of the same day (the last section of `docs/brief.md`): "Let us instead just notify about the release (only win and mac) with a link to the download page: www.robertemilberge.no/glaukopis." The "instead" is of an updater that would download and install the new version itself, which the owner was told would need a key of its own to sign the updates with, files of the update made by the workflow `Installers`, and trials on a real Windows and a real Mac.

## Context

- **Nothing told the writer of a new version.** The installers for Windows and macOS are fetched by hand from the page of packages (`packaging/web/`), and an installation stays at its version until its user goes there again.
- **On Linux** the application is a package of the system (Arch, Debian and Ubuntu, Fedora), which the system's own tools update.
- **The site** robertemilberge.no is asked already: the language packages come from the folder `glaukopis/`, the folder of the installers and of the page (record 0032). Nothing connects to a service the application does not already use, and no personal detail is sent (records 0007 and 0032).

## Decision

1. **A file names the newest version.** `version.json`, of one field, `{"version": "0.2.12"}`, stands in the folder `glaukopis/` of the site beside the installers. It is kept in `packaging/web/packages/` with the page, its version changed with the others of a release, and uploaded with the release's folder, so that it names a version only once the installers of it are there.
2. **Asked at the start, on Windows and macOS.** The first window, once it is shown, asks the site for the file (the core, `releases.rs`, through the command `newer_version`), and compares the version it names with its own, number by number. Windows made after the first do not ask, and Linux never does. A failure to ask, offline or with the file missing, is written in the log and not said.
3. **Told of once.** A newer version is told of at the foot of the window, *Glaukopis 0.2.12 is out.*, with **Download page**, which opens www.robertemilberge.no/glaukopis in the browser. The message stays until it is closed. Each version is told of once (the setting `versionTold`).
4. **Under Settings › About**, on Windows and macOS: **Tell me when a new version is out**, On or Off, on unless turned off. Where a newer version was found at this start, it is named there, with **Download page**, whether or not it was told of before.

## Chosen in the building, and not asked

- On unless turned off, so that those who do not know of the setting are told: the question carries nothing of the writer beyond what any request carries.
- Asked at every start, not once a day: a file of a few bytes, and a start is seldom.
- The message stays until it is closed, rather than going after some seconds, since a start is when one looks elsewhere; and the version stays named under About for those who closed it.
- The file is its own, not a field of the index of the language packages, which another script makes.
- An updater that installs the new version itself is not built; should it come, the file the updater of Tauri reads is another, `latest.json`, so that the two need not meet.

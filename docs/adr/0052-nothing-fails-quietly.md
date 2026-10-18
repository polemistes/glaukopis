# 0052 — Nothing fails quietly: a damaged file is set aside, the page's faults reach the log, workers answer or fail, a failure is never shown as an absence

Date: 2026-10-18. Status: decided by the owner on 2026-10-18, after a review of the whole code; built in the waves of the plan of that review.

## Context

A review of the code on 2026-10-18 found the owner's rule that nothing may fail quietly kept in some modules and broken in the one beside them. A damaged file was handled four ways: the library refused to open over a damaged `collections.json`, the files store set a damaged `files.json` aside with a warning, the settings were replaced by the defaults without a word, and the writer's own words were overwritten when their file could not be read. What the page wrote to its console reached no log, so a fault the page met was seen by no one. Three workers (the search through everything, the history, the writer of the readable copy) had no way to say they had failed: a question to a worker that died was never answered, and a project whose writer had died could not be closed. And in many places a failure was shown as an absence: "no dictionary" for a dictionary that could not be read, "no history", "no versions", "not found", "not on this computer".

## Decision

- **A damaged file is set aside, and the work goes on.** Every store that reads a file of its own (the library's side files, the pictures, the files, the settings, the folders, the own words, a project's files, a language package's manifest) reads it through one helper: a file that cannot be read or understood is renamed with `.broken-<time>` added, beside where it was, what it held is taken as empty or as the defaults, and this is said in the log and in a message at the foot of the window. Nothing is refused, nothing is defaulted without a word, nothing is overwritten that could not be read.
- **The page's faults reach the log of the run.** What the page writes with `console.warn` and `console.error` is written into the log of the run as well, a few lines a second at most and the rest counted, so that a fault the user cannot see is there to be read.
- **A worker answers or fails.** The workers of the page are asked through one client: each question is numbered, a worker that throws or cannot be reached fails every question waiting on it, every question has a time after which it fails, and a worker is ended when what it served is closed. A worker begun again fails only the questions of the one before, and those who asked may ask again.
- **A failure is never an absence.** Where something could not be read, looked up or made, the interface says it could not, with the reason as the log has it, and does not show the empty state that means there is none.
- **At the edge, the cause is kept.** An error met where the program meets the disk, the network, Pandoc, Tesseract or a child process is logged with its cause, and said in a message when the user asked for the thing that failed. A help that is not a condition (a suggestion, a lookup of duplicates) may fail without a message, but never without the log.

## Consequences

- A helper in the core reads a side file or sets it aside; every store uses it.
- A command lets the page write a line into the log; `src/main.ts` sends the console through it.
- One worker client in `src/lib/util/` serves the search, the history and the readable copy.
- The tests read damaged files, have workers throw and stall, and check what the user is told.

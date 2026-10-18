# 0053 — Undo takes in the whole of a change: every part of the project a change may touch, both projects of a carrying, and no undo of what is open

Date: 2026-10-18. Status: decided by the owner on 2026-10-18, after a review of the whole code; built in the waves of the plan of that review.

## Context

The undo of a project followed three parts of it: its meta, its elements and the links between them. A change made in one step could also touch the kinds of element, the kinds of passage, the templates and the comments, which undo did not follow. So undo restored half of a change: a kind deleted came back as a name on its elements and not as a kind, and an element removed came back without its comments. Elements carried between two projects open side by side were undone in both when dragged, and in one only when cut and pasted or sent with *Move to*, so that an undo in one left them in neither. And the undo of *project made*, in the message at the foot of the window, put a project into the trash while it was open.

## Decision

- **Undo follows every part of a project that a change of one's own may touch**: the meta, the elements, the links, the kinds of element and of passage, the templates and the comments. A change removes what it removes in the same step, so that undo brings all of it back.
- **A change that spans two projects is undone in both**, whichever way it was made: dragged, cut and pasted, or sent with *Move to*. The undo steps of the two projects are paired, as a drag already paired them.
- **What is open is not undone from under the user.** The undo of making or copying a project closes the project first where it is open, or, where it cannot, says why and does nothing.

## Consequences

- The undo manager of a project is given the maps of kinds, kinds of passage, templates and comments.
- Cutting and pasting, and *Move to*, pair their steps through the same means as a drag between projects.
- The tests undo a kind deleted, an element removed with its comments, and a carrying made each of the three ways.

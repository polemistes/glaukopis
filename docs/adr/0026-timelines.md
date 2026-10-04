# 0026 — Timelines

Date: 2026-10-01. Status: accepted.

## Context

Those who write about events — of history or of an invented world — need
to see them in time: a city's events beside another's, a life beside the
events of its years. What is known of time is uneven: some dates exact,
some to a year or a century, and much known only as *after* this or
*before* that. A timeline that took only dates would leave out most of
what a scholar knows.

## Decision

- **The facts live on the elements.** An element says when it is (`when`
  on the element): at a point or over a span, each end a time written in
  words, or relative to another element — after, before, between, during —
  and perhaps approximate. A timeline is a view of a map, not a thing of
  its own: every map can be seen as one, beside its diagram and its text,
  once anything in it says when it is.
- **Times are read as spans of what they may be** (`timeline/time.ts`): a
  year is the whole year, a century the whole century, a day a day. Years
  are counted as astronomers count them (1 BC is 0), so that BC and AD lie
  on one axis. A timeline's axis is either dates or **units** of the
  writer's own, in which times are numbers.
- **What is relative is solved** (`timeline/solve.ts`): the window of each
  end is propagated from everything it refers to, and it is drawn in the
  middle of a closed window, or a little way from an open one's edge, with
  the window shown. Chains are drawn in their order. A contradiction is
  reported on the element, as is a reference to what is not placed.
  Where nothing is written at all, the elements are ordered in levels
  without a scale.
- **Lanes are branches** (`timeline/lanes.ts`): by default each child of
  the centre is a lane; the writer chooses otherwise, branch by branch. A
  lane's own placement is its span. An element that stands for another
  map brings that map's placed elements with it, so that maps are compared
  by inclusion, as the document already does.
- **A written time may have a margin either side** (`margin` on the end,
  added 2026-10-01): a length of time, `5 years`, `3 months`, `10 days`,
  or a number of units (`timeline/time.ts`, `readDuration`). The time is
  drawn where it was written, with a band fading away both ways as far as
  the margin reaches; what is relative to it may be anywhere within the
  margin. A lane in which nothing says when it is, its element included,
  is not shown (same day).
- **What says nothing of its time stands within what is over it** (added
  2026-10-04): an element without a placement, under one that has a
  placement in the same lane — the lane's own element included, and up
  through the maps an element stands for — is *implied* within that one's
  time (`timeline/lanes.ts`, `Implied`): drawn faint and dashed in the rows
  under it, at a point along its span, those implied in one element spread
  evenly along it in the order of the text, deeper ones with their path. It
  is a view, not a fact: nothing is written on the element, the chronology
  leaves it out, and it is not counted among what could not be placed. The
  rule is one: the nearest element over it that says when it is, and only
  within the same lane; an element of a lane's branch stays with its lane,
  waiting there, rather than standing within a placed element elsewhere.
  What has nothing over it that says when it is still waits, shown only on
  asking.
- Nothing of it goes into the document yet.

## Consequences

- Lanes can be every element of a kind (`kind` on a lane); a chronology,
  a table of what is placed in the order of time, is added to the map as
  an element of its own, as a copy of the moment. To come: the timeline
  as a figure, and dragging written times along the axis.
- The solving is linear in the number of placed elements and rounds, and is
  done again whenever the project changes; a map of some hundreds of placed
  elements is solved in milliseconds.

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
- **What says nothing of its time is listed under what is over it** (added
  2026-10-04, changed 2026-10-05): when the elements without a time are
  shown, each stands as a card, as in the diagram, in a box at the foot of
  the area of the nearest placed element over it in its lane, or of the
  lane (`timeline/lanes.ts`, `Waiting.under`). It is not placed in time: a
  child's time may well lie outside its parent's, so nothing is read into
  where it stands; nothing is written on the element, the chronology leaves
  it out, and it is not counted among what could not be placed. The first
  form of this, in which such elements were drawn as points spread along
  the parent's span whether or not they were asked for, was taken back the
  day after: they looked placed, and they filled the lane unasked.
- **An element that stands on its own beside the centre is a lane** (2026-10-05),
  as the children of the centre are: before, its placements went to
  "elsewhere in the map", though nothing told it from a child of the centre.
- Nothing of it goes into the document yet.

## Consequences

- Lanes can be every element of a kind (`kind` on a lane); a chronology,
  a table of what is placed in the order of time, is added to the map as
  an element of its own, as a copy of the moment. To come: the timeline
  as a figure, and dragging written times along the axis.
- The solving is linear in the number of placed elements and rounds, and is
  done again whenever the project changes; a map of some hundreds of placed
  elements is solved in milliseconds.
